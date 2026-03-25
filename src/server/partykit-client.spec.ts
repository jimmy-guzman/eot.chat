import { Effect, Either } from "effect";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { server } from "@/testing/mocks/server";

import { createPartyKitRoom, getRoomName } from "./partykit-client";

const BASE = "http://localhost:1999";
const roomEndpoint = (id: string): string => `${BASE}/parties/main/${id}`;

describe("getRoomName", () => {
  it("should return the room name on a 200 response", async () => {
    server.use(
      http.get(roomEndpoint("abc"), () => {
        return HttpResponse.json({ id: "abc", name: "My Room" });
      }),
    );

    const result = await Effect.runPromise(Effect.either(getRoomName("abc")));

    expect(result).toStrictEqual(Either.right("My Room"));
  });

  it("should return RoomNotFoundError on a 404 response", async () => {
    server.use(
      http.get(roomEndpoint("missing"), () => {
        return HttpResponse.json({ error: "not found" }, { status: 404 });
      }),
    );

    const result = await Effect.runPromise(
      Effect.either(getRoomName("missing")),
    );

    expect(Either.isLeft(result)).toBe(true);
    expect(Either.isLeft(result) && result.left._tag).toBe("RoomNotFoundError");
  });

  it("should return PartyKitError on a 500 response after retries", async () => {
    let calls = 0;

    server.use(
      http.get(roomEndpoint("broken"), () => {
        calls++;

        return HttpResponse.json({ error: "server error" }, { status: 500 });
      }),
    );

    const result = await Effect.runPromise(
      Effect.either(getRoomName("broken")),
    );

    expect(Either.isLeft(result)).toBe(true);
    expect(Either.isLeft(result) && result.left._tag).toBe("PartyKitError");
    expect(calls).toBe(3);
  });

  it("should not retry on a 404 response", async () => {
    let calls = 0;

    server.use(
      http.get(roomEndpoint("gone"), () => {
        calls++;

        return HttpResponse.json({ error: "not found" }, { status: 404 });
      }),
    );

    await Effect.runPromise(Effect.either(getRoomName("gone")));

    expect(calls).toBe(1);
  });

  it("should throw a defect when the response body is invalid JSON schema", async () => {
    server.use(
      http.get(roomEndpoint("bad-body"), () => {
        return HttpResponse.json({ unexpected: true });
      }),
    );

    await expect(Effect.runPromise(getRoomName("bad-body"))).rejects.toThrow();
  });
});

describe("createPartyKitRoom", () => {
  it("should succeed on a 200 response", async () => {
    let capturedBody: unknown;

    server.use(
      http.post(roomEndpoint("new-room"), async ({ request }) => {
        capturedBody = await request.json();

        return HttpResponse.json({ name: "New Room" });
      }),
    );

    const result = await Effect.runPromise(
      Effect.either(
        createPartyKitRoom("new-room", {
          hostSecret: "host-secret",
          joinCode: "abc123",
          name: "New Room",
        }),
      ),
    );

    expect(result).toStrictEqual(Either.right(undefined));
    expect(capturedBody).toStrictEqual({
      hostSecret: "host-secret",
      joinCode: "abc123",
      name: "New Room",
    });
  });

  it("should return PartyKitError on a 500 response after retries", async () => {
    let calls = 0;

    server.use(
      http.post(roomEndpoint("fail-create"), () => {
        calls++;

        return HttpResponse.json({ error: "server error" }, { status: 500 });
      }),
    );

    const result = await Effect.runPromise(
      Effect.either(
        createPartyKitRoom("fail-create", {
          hostSecret: "host-secret",
          joinCode: "abc123",
          name: "Room",
        }),
      ),
    );

    expect(Either.isLeft(result)).toBe(true);
    expect(Either.isLeft(result) && result.left._tag).toBe("PartyKitError");
    expect(calls).toBe(3);
  });
});
