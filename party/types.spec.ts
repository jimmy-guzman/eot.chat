import { Either, Schema } from "effect";
import { describe, expect, it } from "vitest";

import {
  ClientMessageSchema,
  MessageSchema,
  ParticipantSchema,
  ServerMessageSchema,
} from "./types";

describe("ClientMessageSchema", () => {
  it("should decode a valid join message", () => {
    const result = Schema.decodeUnknownSync(ClientMessageSchema)({
      displayName: "Alice",
      type: "join",
    });

    expect(result).toStrictEqual({ displayName: "Alice", type: "join" });
  });

  it("should decode a valid message message", () => {
    const result = Schema.decodeUnknownSync(ClientMessageSchema)({
      body: "hello",
      type: "message",
    });

    expect(result).toStrictEqual({ body: "hello", type: "message" });
  });

  it("should decode a valid leave message", () => {
    const result = Schema.decodeUnknownSync(ClientMessageSchema)({
      type: "leave",
    });

    expect(result).toStrictEqual({ type: "leave" });
  });

  it("should return Left for a message with an unknown type", () => {
    const result = Schema.decodeUnknownEither(ClientMessageSchema)({
      type: "unknown",
    });

    expect(Either.isLeft(result)).toBe(true);
  });

  it("should return Left for a join message missing displayName", () => {
    const result = Schema.decodeUnknownEither(ClientMessageSchema)({
      type: "join",
    });

    expect(Either.isLeft(result)).toBe(true);
  });

  it("should return Left for a message message missing body", () => {
    const result = Schema.decodeUnknownEither(ClientMessageSchema)({
      type: "message",
    });

    expect(Either.isLeft(result)).toBe(true);
  });
});

describe("ServerMessageSchema", () => {
  it("should decode a valid init message", () => {
    const result = Schema.decodeUnknownSync(ServerMessageSchema)({
      messages: [],
      participants: [],
      type: "init",
    });

    expect(result).toStrictEqual({
      messages: [],
      participants: [],
      type: "init",
    });
  });

  it("should decode a valid error message", () => {
    const result = Schema.decodeUnknownSync(ServerMessageSchema)({
      reason: "room not found",
      type: "error",
    });

    expect(result).toStrictEqual({ reason: "room not found", type: "error" });
  });

  it("should return Left for an invalid server message", () => {
    const result = Schema.decodeUnknownEither(ServerMessageSchema)({
      type: "invalid",
    });

    expect(Either.isLeft(result)).toBe(true);
  });
});

describe("ParticipantSchema", () => {
  it("should decode a valid participant", () => {
    const result = Schema.decodeUnknownSync(ParticipantSchema)({
      displayName: "Bob",
      joinedAt: "2024-01-01T00:00:00.000Z",
    });

    expect(result).toStrictEqual({
      displayName: "Bob",
      joinedAt: "2024-01-01T00:00:00.000Z",
    });
  });
});

describe("MessageSchema", () => {
  it("should decode a valid message", () => {
    const result = Schema.decodeUnknownSync(MessageSchema)({
      authorDisplayName: "Alice",
      component: { props: { body: "hi" }, type: "TextMessage" },
      id: "abc123",
      rawInput: "hi",
      sentAt: "2024-01-01T00:00:00.000Z",
    });

    expect(result).toStrictEqual({
      authorDisplayName: "Alice",
      component: { props: { body: "hi" }, type: "TextMessage" },
      id: "abc123",
      rawInput: "hi",
      sentAt: "2024-01-01T00:00:00.000Z",
    });
  });
});
