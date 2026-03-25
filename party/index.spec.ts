import type * as Party from "partykit/server";

import { describe, expect, it, vi } from "vitest";

import { mintRoomSessionToken } from "@/server/room-token";

import Server from "./index";
import { ROOM_EXPIRY_MS } from "./types";

type MockFn = ReturnType<typeof vi.fn>;

type MockConn = ReturnType<typeof makeConn>;

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
    connections: Map<string, MockConn>;
    env: Record<string, unknown>;
    id: string;
    storage: ReturnType<typeof makeStorage>;
  }> = {},
): Party.Room => {
  const storage = overrides.storage ?? makeStorage();
  const connections: Map<string, MockConn> = overrides.connections ?? new Map();

  return {
    broadcast: vi.fn(),
    env: overrides.env ?? {
      ROOM_CRYPTO_SECRET: process.env.ROOM_CRYPTO_SECRET ?? "",
    },
    getConnection: vi.fn((id: string): MockConn | null => {
      return connections.get(id) ?? null;
    }),
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

const joinMessage = async (
  roomId: string,
  displayName: string,
  sessionId = "session-1",
): Promise<string> => {
  const secret = process.env.ROOM_CRYPTO_SECRET ?? "";

  return JSON.stringify({
    displayName,
    sessionId,
    sessionToken: await mintRoomSessionToken(roomId, secret),
    type: "join",
  });
};

describe("Server.onRequest", () => {
  it("should create a room and return 200 with id and name", async () => {
    const storage = makeStorage();
    const room = makeRoom({ id: "abc123", storage });
    const s = new Server(room);

    const req = makeRequest(
      "POST",
      { "X-Action": "create" },
      {
        hostSecret: "host-secret",
        joinCode: "abc123",
        name: "My Room",
      },
    );
    const res = await s.onRequest(req);

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toStrictEqual({
      id: "abc123",
      joinCode: "abc123",
      joinCodeVersion: 1,
      name: "My Room",
    });
    expect(storage.put).toHaveBeenCalledWith("name", "My Room");
    expect(storage.put).toHaveBeenCalledWith("joinCode", "abc123");
    expect(storage.put).toHaveBeenCalledWith("hostSecret", "host-secret");
  });

  it("should return 405 when method is not GET or POST", async () => {
    const room = makeRoom();
    const s = new Server(room);

    const req = makeRequest("DELETE", {}, null);
    const res = await s.onRequest(req);

    expect(res.status).toBe(405);
  });

  it("should return room name on GET when room exists", async () => {
    const storage = makeStorage({
      joinCode: "ab2cd3",
      joinCodeVersion: 1,
      name: "My Room",
    });
    const room = makeRoom({ id: "abc123", storage });
    const s = new Server(room);

    const req = makeRequest("GET", {}, null);
    const res = await s.onRequest(req);

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toStrictEqual({
      id: "abc123",
      joinCode: "ab2cd3",
      joinCodeVersion: 1,
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
      {
        hostSecret: "host-secret",
        joinCode: "xyz789",
        name: "New Room",
      },
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

  it("should return 400 when joinCode is missing", async () => {
    const room = makeRoom();
    const s = new Server(room);

    const req = makeRequest(
      "POST",
      { "X-Action": "create" },
      { hostSecret: "host-secret", name: "Room" },
    );
    const res = await s.onRequest(req);

    expect(res.status).toBe(400);
  });

  it("should return 400 when name is blank", async () => {
    const room = makeRoom();
    const s = new Server(room);

    const req = makeRequest(
      "POST",
      { "X-Action": "create" },
      {
        hostSecret: "host-secret",
        joinCode: "abc123",
        name: "   ",
      },
    );
    const res = await s.onRequest(req);

    expect(res.status).toBe(400);
  });
});

describe("Server.onConnect", () => {
  it("should not send init until the client joins over WebSocket", async () => {
    const storage = makeStorage({ name: "My Room" });
    const room = makeRoom({ storage });
    const s = new Server(room);
    const conn = makeConn();

    await s.onConnect(conn);

    expect(conn.send).not.toHaveBeenCalled();
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

  it("should cancel a pending expiry alarm when a participant successfully joins", async () => {
    const storage = makeStorage({ name: "My Room" });
    const room = makeRoom({ storage });
    const s = new Server(room);
    const conn = makeConn();

    await s.onConnect(conn);

    expect(storage.deleteAlarm).not.toHaveBeenCalled();

    await s.onMessage(await joinMessage("test-room", "Alice"), conn);

    expect(storage.deleteAlarm).toHaveBeenCalledOnce();
  });
});

describe("Server.onMessage — join", () => {
  it("should add participant and send init to sender, broadcast joined to others", async () => {
    const storage = makeStorage({ name: "My Room" });
    const room = makeRoom({ storage });
    const s = new Server(room);
    const conn = makeConn("conn-1");

    await s.onMessage(await joinMessage("test-room", "Alice"), conn);

    expect(conn.send).toHaveBeenCalledOnce();

    const sent = JSON.parse(conn.send.mock.calls[0][0] as string) as unknown;

    expect(sent).toMatchObject({ type: "init" });

    const broadcastMock = room.broadcast as MockFn;

    expect(broadcastMock).toHaveBeenCalledOnce();

    const broadcasted = JSON.parse(
      broadcastMock.mock.calls[0][0] as string,
    ) as unknown;

    expect(broadcasted).toMatchObject({ type: "joined" });
    expect(conn.setState).toHaveBeenCalledWith({
      displayName: "Alice",
      sessionId: "session-1",
    });
  });

  it("should reject a different session using a duplicate displayName", async () => {
    const storage = makeStorage({ name: "My Room" });
    const room = makeRoom({ storage });
    const s = new Server(room);
    const conn1 = makeConn("conn-1");
    const conn2 = makeConn("conn-2");

    await s.onMessage(
      await joinMessage("test-room", "Alice", "session-a"),
      conn1,
    );
    await s.onMessage(
      await joinMessage("test-room", "Alice", "session-b"),
      conn2,
    );

    expect(room.broadcast).toHaveBeenCalledOnce();

    const sent = JSON.parse(conn2.send.mock.calls[0][0] as string) as {
      reason: string;
      type: string;
    };

    expect(sent).toStrictEqual({
      reason: "display name taken",
      type: "error",
    });
  });

  it("should evict the previous tab and allow the new tab when same sessionId joins with duplicate displayName", async () => {
    const conn1 = makeConn("conn-1");
    const conn2 = makeConn("conn-2");
    const connections = new Map([["conn-1", conn1]]);
    const storage = makeStorage({ name: "My Room" });
    const room = makeRoom({ connections, storage });
    const s = new Server(room);

    await s.onMessage(
      await joinMessage("test-room", "Alice", "session-a"),
      conn1,
    );

    const broadcastMock = room.broadcast as MockFn;

    broadcastMock.mockClear();

    await s.onMessage(
      await joinMessage("test-room", "Alice", "session-a"),
      conn2,
    );

    expect(conn1.close).toHaveBeenCalledWith(4000, "replaced");
    expect(conn2.send).toHaveBeenCalledOnce();

    const sent = JSON.parse(conn2.send.mock.calls[0][0] as string) as {
      type: string;
    };

    expect(sent).toMatchObject({ type: "init" });
    expect(broadcastMock).toHaveBeenCalledOnce();

    const broadcasted = JSON.parse(
      broadcastMock.mock.calls[0][0] as string,
    ) as { type: string };

    expect(broadcasted).toMatchObject({ type: "joined" });
  });

  it("should reject join when session token is invalid", async () => {
    const storage = makeStorage({ name: "My Room" });
    const room = makeRoom({ storage });
    const s = new Server(room);
    const conn = makeConn();

    await s.onMessage(
      JSON.stringify({
        displayName: "Alice",
        sessionId: "session-1",
        sessionToken: "invalid",
        type: "join",
      }),
      conn,
    );

    expect(conn.send).toHaveBeenCalledOnce();

    const sent = JSON.parse(conn.send.mock.calls[0][0] as string) as {
      reason: string;
      type: string;
    };

    expect(sent).toStrictEqual({ reason: "unauthorized", type: "error" });
  });
});

describe("Server.onMessage — message", () => {
  it("should broadcast a message with the raw input", async () => {
    const storage = makeStorage({ name: "My Room" });
    const room = makeRoom({ storage });
    const s = new Server(room);
    const conn = makeConn("conn-1");

    await s.onMessage(await joinMessage("test-room", "Alice"), conn);

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

    await s.onMessage(await joinMessage("test-room", "Alice"), conn);

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

    await s.onMessage(await joinMessage("test-room", "Alice"), conn);

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

    await s.onMessage(await joinMessage("test-room", "Alice"), conn);
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

    await s.onMessage(await joinMessage("test-room", "Alice"), conn1);
    await s.onMessage(await joinMessage("test-room", "Bob"), conn2);
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

    await s.onMessage(await joinMessage("test-room", "Alice"), conn);
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

    await s.onMessage(await joinMessage("test-room", "Alice"), conn1);
    await s.onMessage(await joinMessage("test-room", "Bob"), conn2);
    await s.onClose(conn1);

    expect(storage.setAlarm).not.toHaveBeenCalled();
  });

  it("should broadcast left but not cleared when a participant disconnects abruptly", async () => {
    const storage = makeStorage({ name: "My Room" });
    const room = makeRoom({ storage });
    const s = new Server(room);
    const conn = makeConn("conn-1");

    await s.onMessage(await joinMessage("test-room", "Alice"), conn);

    const broadcastMock = room.broadcast as MockFn;

    broadcastMock.mockClear();

    await s.onClose(conn);

    const calls = (broadcastMock.mock.calls as [string][]).map(
      ([raw]) => JSON.parse(raw) as unknown,
    );
    const types = calls.map((c) => (c as { type: string }).type);

    expect(types).toContain("left");
    expect(types).not.toContain("cleared");
  });

  it("should preserve messages when a participant disconnects abruptly", async () => {
    const storage = makeStorage({ name: "My Room" });
    const room = makeRoom({ storage });
    const s = new Server(room);
    const conn1 = makeConn("conn-1");
    const conn2 = makeConn("conn-2");

    await s.onMessage(await joinMessage("test-room", "Alice"), conn1);
    await s.onMessage(await joinMessage("test-room", "Bob"), conn2);
    await s.onMessage(
      JSON.stringify({ body: "fruit", type: "message" }),
      conn1,
    );

    await s.onClose(conn1);

    const broadcastMock = room.broadcast as MockFn;
    const lastLeft = broadcastMock.mock.calls
      .map(([raw]) => JSON.parse(raw as string) as unknown)
      .findLast((c) => (c as { type: string }).type === "left") as
      | undefined
      | {
          participants: unknown[];
          type: string;
        };

    expect(lastLeft).toMatchObject({ type: "left" });

    const conn3 = makeConn("conn-3");

    await s.onConnect(conn3);
    await s.onMessage(await joinMessage("test-room", "Carol"), conn3);

    const initSent = JSON.parse(
      conn3.send.mock.calls.at(-1)?.[0] as string,
    ) as {
      messages: unknown[];
      type: string;
    };

    expect(initSent.type).toBe("init");
    expect(initSent.messages).toHaveLength(1);
  });
});

describe("Server.onMessage — clear", () => {
  it("should clear messages and broadcast cleared when a participant sends clear", async () => {
    const storage = makeStorage({ name: "My Room" });
    const room = makeRoom({ storage });
    const s = new Server(room);
    const conn = makeConn("conn-1");

    await s.onMessage(await joinMessage("test-room", "Alice"), conn);
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

    await s.onMessage(await joinMessage("test-room", "Alice"), conn1);
    await s.onMessage(await joinMessage("test-room", "Bob"), conn2);
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

    await s.onMessage(await joinMessage("test-room", "Alice"), conn);

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
