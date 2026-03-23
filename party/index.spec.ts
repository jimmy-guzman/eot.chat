import type * as Party from "partykit/server";

import { describe, expect, it, vi } from "vitest";

import Server from "./index";
import { ROOM_EXPIRY_MS } from "./types";

type MockFn = ReturnType<typeof vi.fn>;

const makeStorage = (initial: Record<string, unknown> = {}) => {
  const store = new Map<string, unknown>(Object.entries(initial));

  const del: MockFn = vi.fn((key: string) => {
    store.delete(key);

    return Promise.resolve();
  });
  const deleteAll: MockFn = vi.fn(() => {
    store.clear();

    return Promise.resolve();
  });
  const deleteAlarm: MockFn = vi.fn(() => Promise.resolve());
  const get: MockFn = vi.fn(<T>(key: string) => {
    return Promise.resolve(store.get(key) as T | undefined);
  });
  const put: MockFn = vi.fn((key: string, value: unknown) => {
    store.set(key, value);

    return Promise.resolve();
  });
  const setAlarm: MockFn = vi.fn(() => Promise.resolve());

  return { delete: del, deleteAlarm, deleteAll, get, put, setAlarm };
};

const makeRoom = (
  overrides: Partial<{
    env: Record<string, unknown>;
    id: string;
    storage: ReturnType<typeof makeStorage>;
  }> = {},
): Party.Room => {
  const storage = overrides.storage ?? makeStorage();

  return {
    broadcast: vi.fn(),
    env: overrides.env ?? {},
    id: overrides.id ?? "test-room",
    storage,
  } as unknown as Party.Room;
};

const makeConn = (
  id = "conn-1",
  initialState: Record<string, unknown> = {},
) => {
  const close: MockFn = vi.fn();
  const send: MockFn = vi.fn();

  let state: Record<string, unknown> = initialState;

  const setState: MockFn = vi.fn((s: Record<string, unknown>) => {
    state = s;
  });

  const conn = {
    close,
    id,
    send,
    setState,
    get state() {
      return state;
    },
  } as unknown as Party.Connection & {
    close: MockFn;
    send: MockFn;
    setState: MockFn;
  };

  return conn;
};

const makeRequest = (
  method: string,
  headers: Record<string, string>,
  body: unknown,
): Party.Request => {
  return {
    headers: { get: (key: string) => headers[key] ?? null },
    json: () => Promise.resolve(body),
    method,
  } as unknown as Party.Request;
};

describe("Server.onRequest", () => {
  it("should create a room and return 200 with id and name", async () => {
    const storage = makeStorage();
    const room = makeRoom({ id: "abc123", storage });
    const s = new Server(room);

    const req = makeRequest(
      "POST",
      { "X-Action": "create" },
      { name: "My Room" },
    );
    const res = await s.onRequest(req);

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toStrictEqual({
      id: "abc123",
      name: "My Room",
    });
    expect(storage.put).toHaveBeenCalledWith("name", "My Room");
  });

  it("should return 405 when method is not GET or POST", async () => {
    const room = makeRoom();
    const s = new Server(room);

    const req = makeRequest("DELETE", {}, null);
    const res = await s.onRequest(req);

    expect(res.status).toBe(405);
  });

  it("should return room name on GET when room exists", async () => {
    const storage = makeStorage({ name: "My Room" });
    const room = makeRoom({ id: "abc123", storage });
    const s = new Server(room);

    const req = makeRequest("GET", {}, null);
    const res = await s.onRequest(req);

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toStrictEqual({
      id: "abc123",
      name: "My Room",
    });
  });

  it("should return 404 on GET when room does not exist", async () => {
    const room = makeRoom();
    const s = new Server(room);

    const req = makeRequest("GET", {}, null);
    const res = await s.onRequest(req);

    expect(res.status).toBe(404);
  });

  it("should return 405 when X-Action header is missing", async () => {
    const room = makeRoom();
    const s = new Server(room);

    const req = makeRequest("POST", {}, { name: "Room" });
    const res = await s.onRequest(req);

    expect(res.status).toBe(405);
  });

  it("should return 409 when room already exists", async () => {
    const storage = makeStorage({ name: "Existing Room" });
    const room = makeRoom({ storage });
    const s = new Server(room);

    const req = makeRequest(
      "POST",
      { "X-Action": "create" },
      { name: "New Room" },
    );
    const res = await s.onRequest(req);

    expect(res.status).toBe(409);
  });

  it("should return 400 when name is missing", async () => {
    const room = makeRoom();
    const s = new Server(room);

    const req = makeRequest("POST", { "X-Action": "create" }, {});
    const res = await s.onRequest(req);

    expect(res.status).toBe(400);
  });

  it("should return 400 when name is blank", async () => {
    const room = makeRoom();
    const s = new Server(room);

    const req = makeRequest("POST", { "X-Action": "create" }, { name: "   " });
    const res = await s.onRequest(req);

    expect(res.status).toBe(400);
  });
});

describe("Server.onConnect", () => {
  it("should send init when room exists", async () => {
    const storage = makeStorage({ name: "My Room" });
    const room = makeRoom({ storage });
    const s = new Server(room);
    const conn = makeConn();

    await s.onConnect(conn);

    expect(conn.send).toHaveBeenCalledOnce();

    const sent = JSON.parse(conn.send.mock.calls[0][0] as string) as unknown;

    expect(sent).toMatchObject({
      messages: [],
      participants: [],
      type: "init",
    });
    expect(conn.close).not.toHaveBeenCalled();
  });

  it("should send error and close when room does not exist", async () => {
    const room = makeRoom();
    const s = new Server(room);
    const conn = makeConn();

    await s.onConnect(conn);

    expect(conn.send).toHaveBeenCalledOnce();

    const sent = JSON.parse(conn.send.mock.calls[0][0] as string) as unknown;

    expect(sent).toMatchObject({ reason: "room not found", type: "error" });
    expect(conn.close).toHaveBeenCalledOnce();
  });

  it("should cancel a pending expiry alarm when a connection opens", async () => {
    const storage = makeStorage({ name: "My Room" });
    const room = makeRoom({ storage });
    const s = new Server(room);
    const conn = makeConn();

    await s.onConnect(conn);

    expect(storage.deleteAlarm).toHaveBeenCalledOnce();
  });
});

describe("Server.onMessage — join", () => {
  it("should add participant and send init to sender, broadcast joined to others", async () => {
    const storage = makeStorage({ name: "My Room" });
    const room = makeRoom({ storage });
    const s = new Server(room);
    const conn = makeConn("conn-1");

    await s.onMessage(
      JSON.stringify({ displayName: "Alice", type: "join" }),
      conn,
    );

    expect(conn.send).toHaveBeenCalledOnce();

    const sent = JSON.parse(conn.send.mock.calls[0][0] as string) as unknown;

    expect(sent).toMatchObject({ type: "init" });

    const broadcastMock = room.broadcast as MockFn;

    expect(broadcastMock).toHaveBeenCalledOnce();

    const broadcasted = JSON.parse(
      broadcastMock.mock.calls[0][0] as string,
    ) as unknown;

    expect(broadcasted).toMatchObject({ type: "joined" });
    expect(conn.setState).toHaveBeenCalledWith({ displayName: "Alice" });
  });

  it("should not add a duplicate displayName", async () => {
    const storage = makeStorage({ name: "My Room" });
    const room = makeRoom({ storage });
    const s = new Server(room);
    const conn1 = makeConn("conn-1");
    const conn2 = makeConn("conn-2");

    await s.onMessage(
      JSON.stringify({ displayName: "Alice", type: "join" }),
      conn1,
    );
    await s.onMessage(
      JSON.stringify({ displayName: "Alice", type: "join" }),
      conn2,
    );

    expect(room.broadcast).toHaveBeenCalledOnce();
  });
});

describe("Server.onMessage — message", () => {
  it("should broadcast a message with the raw input", async () => {
    const storage = makeStorage({ name: "My Room" });
    const room = makeRoom({ storage });
    const s = new Server(room);
    const conn = makeConn("conn-1");

    await s.onMessage(
      JSON.stringify({ displayName: "Alice", type: "join" }),
      conn,
    );

    const broadcastMock = room.broadcast as MockFn;

    broadcastMock.mockClear();

    await s.onMessage(JSON.stringify({ body: "hello", type: "message" }), conn);

    expect(broadcastMock).toHaveBeenCalledOnce();

    const broadcasted = JSON.parse(
      broadcastMock.mock.calls[0][0] as string,
    ) as unknown;

    expect(broadcasted).toMatchObject({
      message: {
        rawInput: "hello",
      },
      type: "message",
    });
  });

  it("should not broadcast an empty message", async () => {
    const storage = makeStorage({ name: "My Room" });
    const room = makeRoom({ storage });
    const s = new Server(room);
    const conn = makeConn("conn-1");

    await s.onMessage(
      JSON.stringify({ displayName: "Alice", type: "join" }),
      conn,
    );

    const broadcastMock = room.broadcast as MockFn;

    broadcastMock.mockClear();

    await s.onMessage(JSON.stringify({ body: "   ", type: "message" }), conn);

    expect(broadcastMock).not.toHaveBeenCalled();
  });
});

describe("Server.onMessage — leave", () => {
  it("should remove participant and broadcast cleared then left", async () => {
    const storage = makeStorage({ name: "My Room" });
    const room = makeRoom({ storage });
    const s = new Server(room);
    const conn = makeConn("conn-1");

    await s.onMessage(
      JSON.stringify({ displayName: "Alice", type: "join" }),
      conn,
    );

    const broadcastMock = room.broadcast as MockFn;

    broadcastMock.mockClear();

    await s.onMessage(JSON.stringify({ type: "leave" }), conn);

    expect(broadcastMock).toHaveBeenCalledTimes(2);

    const first = JSON.parse(
      broadcastMock.mock.calls[0][0] as string,
    ) as unknown;
    const second = JSON.parse(
      broadcastMock.mock.calls[1][0] as string,
    ) as unknown;

    expect(first).toMatchObject({ type: "cleared" });
    expect(second).toMatchObject({ type: "left" });
  });

  it("should schedule a 1-hour expiry alarm when the last participant leaves", async () => {
    const storage = makeStorage({ name: "My Room" });
    const room = makeRoom({ storage });
    const s = new Server(room);
    const conn = makeConn("conn-1");

    await s.onMessage(
      JSON.stringify({ displayName: "Alice", type: "join" }),
      conn,
    );
    await s.onMessage(JSON.stringify({ type: "leave" }), conn);

    expect(storage.setAlarm).toHaveBeenCalledOnce();

    const alarmTime = storage.setAlarm.mock.calls[0][0] as number;
    const toleranceMs = 60_000;

    expect(alarmTime).toBeGreaterThanOrEqual(
      Date.now() + ROOM_EXPIRY_MS - toleranceMs,
    );
    expect(alarmTime).toBeLessThanOrEqual(
      Date.now() + ROOM_EXPIRY_MS + toleranceMs,
    );
  });

  it("should not schedule an alarm when other participants remain", async () => {
    const storage = makeStorage({ name: "My Room" });
    const room = makeRoom({ storage });
    const s = new Server(room);
    const conn1 = makeConn("conn-1");
    const conn2 = makeConn("conn-2");

    await s.onMessage(
      JSON.stringify({ displayName: "Alice", type: "join" }),
      conn1,
    );
    await s.onMessage(
      JSON.stringify({ displayName: "Bob", type: "join" }),
      conn2,
    );
    await s.onMessage(JSON.stringify({ type: "leave" }), conn1);

    expect(storage.setAlarm).not.toHaveBeenCalled();
  });
});

describe("Server.onClose", () => {
  it("should schedule a 1-hour expiry alarm when the last participant disconnects abruptly", async () => {
    const storage = makeStorage({ name: "My Room" });
    const room = makeRoom({ storage });
    const s = new Server(room);
    const conn = makeConn("conn-1");

    await s.onMessage(
      JSON.stringify({ displayName: "Alice", type: "join" }),
      conn,
    );
    await s.onClose(conn);

    expect(storage.setAlarm).toHaveBeenCalledOnce();
    expect(storage.delete).not.toHaveBeenCalled();
  });

  it("should not schedule an alarm when other participants remain after disconnect", async () => {
    const storage = makeStorage({ name: "My Room" });
    const room = makeRoom({ storage });
    const s = new Server(room);
    const conn1 = makeConn("conn-1");
    const conn2 = makeConn("conn-2");

    await s.onMessage(
      JSON.stringify({ displayName: "Alice", type: "join" }),
      conn1,
    );
    await s.onMessage(
      JSON.stringify({ displayName: "Bob", type: "join" }),
      conn2,
    );
    await s.onClose(conn1);

    expect(storage.setAlarm).not.toHaveBeenCalled();
  });
});

describe("Server.onMessage — clear", () => {
  it("should clear messages and broadcast cleared when a participant sends clear", async () => {
    const storage = makeStorage({ name: "My Room" });
    const room = makeRoom({ storage });
    const s = new Server(room);
    const conn = makeConn("conn-1");

    await s.onMessage(
      JSON.stringify({ displayName: "Alice", type: "join" }),
      conn,
    );
    await s.onMessage(JSON.stringify({ body: "hello", type: "message" }), conn);

    const broadcastMock = room.broadcast as MockFn;

    broadcastMock.mockClear();

    await s.onMessage(JSON.stringify({ type: "clear" }), conn);

    expect(broadcastMock).toHaveBeenCalledOnce();

    const broadcasted = JSON.parse(
      broadcastMock.mock.calls[0][0] as string,
    ) as unknown;

    expect(broadcasted).toMatchObject({ type: "cleared" });
  });

  it("should clear messages and broadcast cleared when clear arrives before join but connection state is set", async () => {
    const storage = makeStorage({ name: "My Room" });
    const room = makeRoom({ storage });
    const s = new Server(room);
    const conn = makeConn("conn-1", { displayName: "Alice" });

    await s.onMessage(JSON.stringify({ body: "hello", type: "message" }), conn);

    const broadcastMock = room.broadcast as MockFn;

    broadcastMock.mockClear();

    await s.onMessage(JSON.stringify({ type: "clear" }), conn);

    expect(broadcastMock).toHaveBeenCalledOnce();

    const broadcasted = JSON.parse(
      broadcastMock.mock.calls[0][0] as string,
    ) as unknown;

    expect(broadcasted).toMatchObject({
      displayName: "Alice",
      type: "cleared",
    });
  });

  it("should clear messages and broadcast cleared when a participant leaves mid-session", async () => {
    const storage = makeStorage({ name: "My Room" });
    const room = makeRoom({ storage });
    const s = new Server(room);
    const conn1 = makeConn("conn-1");
    const conn2 = makeConn("conn-2");

    await s.onMessage(
      JSON.stringify({ displayName: "Alice", type: "join" }),
      conn1,
    );
    await s.onMessage(
      JSON.stringify({ displayName: "Bob", type: "join" }),
      conn2,
    );
    await s.onMessage(
      JSON.stringify({ body: "hello", type: "message" }),
      conn1,
    );

    const broadcastMock = room.broadcast as MockFn;

    broadcastMock.mockClear();

    await s.onMessage(JSON.stringify({ type: "leave" }), conn1);

    const calls = (broadcastMock.mock.calls as [string][]).map(
      ([raw]) => JSON.parse(raw) as unknown,
    );
    const clearedCall = calls.find(
      (c) => (c as { type: string }).type === "cleared",
    );

    expect(clearedCall).toMatchObject({ type: "cleared" });
  });
});

describe("Server.onMessage — invalid input", () => {
  it("should silently ignore malformed JSON", async () => {
    const room = makeRoom();
    const s = new Server(room);
    const conn = makeConn();

    await expect(s.onMessage("not json {{", conn)).resolves.toBeUndefined();
    expect(room.broadcast).not.toHaveBeenCalled();
  });

  it("should silently ignore an unknown message type", async () => {
    const room = makeRoom();
    const s = new Server(room);
    const conn = makeConn();

    await expect(
      s.onMessage(JSON.stringify({ type: "unknown" }), conn),
    ).resolves.toBeUndefined();
    expect(room.broadcast).not.toHaveBeenCalled();
  });
});

describe("Server.onAlarm", () => {
  it("should delete all storage when the alarm fires", async () => {
    const storage = makeStorage({ name: "My Room" });
    const room = makeRoom({ storage });
    const s = new Server(room);

    await s.onAlarm();

    expect(storage.deleteAll).toHaveBeenCalledOnce();
  });
});

describe("Server.onMessage — typing", () => {
  it("should broadcast typing to all connections except the sender", async () => {
    const storage = makeStorage({ name: "My Room" });
    const room = makeRoom({ storage });
    const s = new Server(room);
    const conn = makeConn("conn-1");

    await s.onMessage(
      JSON.stringify({ displayName: "Alice", type: "join" }),
      conn,
    );

    const broadcastMock = room.broadcast as MockFn;

    broadcastMock.mockClear();

    await s.onMessage(JSON.stringify({ type: "typing" }), conn);

    expect(broadcastMock).toHaveBeenCalledOnce();

    const [payload, excluded] = broadcastMock.mock.calls[0] as [
      string,
      string[],
    ];
    const broadcasted = JSON.parse(payload) as unknown;

    expect(broadcasted).toMatchObject({ displayName: "Alice", type: "typing" });
    expect(excluded).toStrictEqual(["conn-1"]);
  });

  it("should not broadcast typing if the sender has not joined", async () => {
    const storage = makeStorage({ name: "My Room" });
    const room = makeRoom({ storage });
    const s = new Server(room);
    const conn = makeConn("conn-1");

    const broadcastMock = room.broadcast as MockFn;

    await s.onMessage(JSON.stringify({ type: "typing" }), conn);

    expect(broadcastMock).not.toHaveBeenCalled();
  });
});
