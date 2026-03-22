import type * as Party from "partykit/server";

import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { server } from "@/testing/mocks/server";

import Server from "./index";

type MockFn = ReturnType<typeof vi.fn>;

const makeStorage = (initial: Record<string, unknown> = {}) => {
  const store = new Map<string, unknown>(Object.entries(initial));

  const del: MockFn = vi.fn((key: string) => {
    store.delete(key);

    return Promise.resolve();
  });
  const get: MockFn = vi.fn(<T>(key: string) => {
    return Promise.resolve(store.get(key) as T | undefined);
  });
  const put: MockFn = vi.fn((key: string, value: unknown) => {
    store.set(key, value);

    return Promise.resolve();
  });

  return { delete: del, get, put };
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

const makeConn = (id = "conn-1") => {
  const close: MockFn = vi.fn();
  const send: MockFn = vi.fn();

  return {
    close,
    id,
    send,
  } as unknown as Party.Connection & { close: MockFn; send: MockFn };
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

  it("should return 405 when method is not POST", async () => {
    const room = makeRoom();
    const s = new Server(room);

    const req = makeRequest("GET", {}, null);
    const res = await s.onRequest(req);

    expect(res.status).toBe(405);
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
  });

  it("should not add a duplicate display name", async () => {
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
  beforeEach(() => {
    const content = JSON.stringify({
      props: { body: "hello" },
      type: "TextMessage",
    });
    const response = {
      id: "resp-1",
      output: [],
      outputText: content,
      status: "completed",
      usage: { inputTokens: 1, outputTokens: 1 },
    };
    const sseBody = `data: ${JSON.stringify({ response, type: "response.completed" })}\n\n`;

    server.use(
      http.post("https://openrouter.ai/api/v1/responses", () => {
        return new HttpResponse(sseBody, {
          headers: { "Content-Type": "text/event-stream" },
          status: 200,
        });
      }),
    );
  });

  it("should broadcast a message with TextMessage fallback when no API key", async () => {
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
        component: { props: { body: "hello" }, type: "TextMessage" },
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
  it("should remove participant and broadcast left", async () => {
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

    expect(broadcastMock).toHaveBeenCalledOnce();

    const broadcasted = JSON.parse(
      broadcastMock.mock.calls[0][0] as string,
    ) as unknown;

    expect(broadcasted).toMatchObject({ type: "left" });
  });
});

describe("Server.onClose", () => {
  it("should dissolve the room when last participant disconnects", async () => {
    const storage = makeStorage({ name: "My Room" });
    const room = makeRoom({ storage });
    const s = new Server(room);
    const conn = makeConn("conn-1");

    await s.onMessage(
      JSON.stringify({ displayName: "Alice", type: "join" }),
      conn,
    );
    await s.onClose(conn);

    expect(storage.delete).toHaveBeenCalledWith("name");
  });

  it("should not dissolve the room when other participants remain", async () => {
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

    expect(storage.delete).not.toHaveBeenCalled();
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
