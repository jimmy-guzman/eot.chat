import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createActor, fromCallback } from "xstate";

import type { Message, Participant } from "../../../../../party/types";
import type { SocketEvent } from "./room-machine";

import { roomMachine } from "./room-machine";

const testDisplayName = "Alice";
const testId = "room-1";

const makeMessage = (overrides: Partial<Message> = {}): Message => {
  return {
    authorDisplayName: testDisplayName,
    id: "msg-1",
    rawInput: "hello",
    sentAt: "2024-01-01T00:00:00.000Z",
    ...overrides,
  };
};

const makeParticipant = (displayName: string): Participant => {
  return { displayName, joinedAt: "2024-01-01T00:00:00.000Z" };
};

const noopCleanup = () => undefined;

const noopSocketActor = fromCallback<
  SocketEvent,
  { displayName: string; id: string }
>(() => noopCleanup);

const testMachine = roomMachine.provide({
  actors: { socketActor: noopSocketActor },
});

const makeActor = () => {
  const actor = createActor(testMachine, {
    input: { displayName: testDisplayName, id: testId },
  });

  actor.start();

  return actor;
};

describe("roomMachine", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should start in the connected state", () => {
    const actor = makeActor();

    expect(actor.getSnapshot().value).toBe("connected");
  });

  it("should set messages and participants on SOCKET_INIT", () => {
    const actor = makeActor();
    const messages = [makeMessage()];
    const participants = [makeParticipant(testDisplayName)];

    actor.send({ messages, participants, type: "SOCKET_INIT" });

    const { context } = actor.getSnapshot();

    expect(context.messages).toStrictEqual(messages);
    expect(context.participants).toStrictEqual(participants);
  });

  it("should append a new message on SOCKET_MESSAGE", () => {
    const actor = makeActor();
    const message = makeMessage({ authorDisplayName: "Bob", id: "msg-2" });

    actor.send({ message, type: "SOCKET_MESSAGE" });

    expect(actor.getSnapshot().context.messages).toStrictEqual([message]);
  });

  it("should reconcile an optimistic message on SOCKET_MESSAGE", () => {
    const actor = makeActor();
    const optimisticId = "optimistic-abc";
    const body = "hello";

    actor.send({ body, optimisticId, type: "SEND_MESSAGE" });

    expect(actor.getSnapshot().context.messages[0]?.id).toBe(optimisticId);

    const realMessage = makeMessage({ id: "real-msg-1", rawInput: body });

    actor.send({ message: realMessage, type: "SOCKET_MESSAGE" });

    const { messages } = actor.getSnapshot().context;

    expect(messages).toHaveLength(1);
    expect(messages[0]).toStrictEqual(realMessage);
  });

  it("should clear messages on SOCKET_CLEARED", () => {
    const actor = makeActor();

    actor.send({
      messages: [makeMessage()],
      participants: [],
      type: "SOCKET_INIT",
    });
    actor.send({ type: "SOCKET_CLEARED" });

    expect(actor.getSnapshot().context.messages).toStrictEqual([]);
  });

  it("should update participants on SOCKET_JOINED", () => {
    const actor = makeActor();
    const participants = [makeParticipant("Alice"), makeParticipant("Bob")];

    actor.send({ participants, type: "SOCKET_JOINED" });

    expect(actor.getSnapshot().context.participants).toStrictEqual(
      participants,
    );
  });

  it("should update participants on SOCKET_LEFT", () => {
    const actor = makeActor();
    const participants = [makeParticipant("Alice")];

    actor.send({
      participants: [makeParticipant("Alice"), makeParticipant("Bob")],
      type: "SOCKET_JOINED",
    });
    actor.send({ participants, type: "SOCKET_LEFT" });

    expect(actor.getSnapshot().context.participants).toStrictEqual(
      participants,
    );
  });

  it("should add a name to typingNames on SOCKET_TYPING", () => {
    const actor = makeActor();

    actor.send({ displayName: "Bob", type: "SOCKET_TYPING" });

    expect(actor.getSnapshot().context.typingNames).toStrictEqual(["Bob"]);
  });

  it("should not duplicate a name already in typingNames on SOCKET_TYPING", () => {
    const actor = makeActor();

    actor.send({ displayName: "Bob", type: "SOCKET_TYPING" });
    actor.send({ displayName: "Bob", type: "SOCKET_TYPING" });

    expect(actor.getSnapshot().context.typingNames).toStrictEqual(["Bob"]);
  });

  it("should remove a name from typingNames after 3000ms", () => {
    const actor = makeActor();

    actor.send({ displayName: "Bob", type: "SOCKET_TYPING" });

    expect(actor.getSnapshot().context.typingNames).toStrictEqual(["Bob"]);

    vi.advanceTimersByTime(3000);

    expect(actor.getSnapshot().context.typingNames).toStrictEqual([]);
  });

  it("should reset the typing timer when the same user sends another SOCKET_TYPING", () => {
    const actor = makeActor();

    actor.send({ displayName: "Bob", type: "SOCKET_TYPING" });
    vi.advanceTimersByTime(2000);
    actor.send({ displayName: "Bob", type: "SOCKET_TYPING" });
    vi.advanceTimersByTime(2000);

    expect(actor.getSnapshot().context.typingNames).toStrictEqual(["Bob"]);

    vi.advanceTimersByTime(1000);

    expect(actor.getSnapshot().context.typingNames).toStrictEqual([]);
  });

  it("should transition to error final state on SOCKET_ERROR", () => {
    const actor = makeActor();

    actor.send({ type: "SOCKET_ERROR" });

    const snapshot = actor.getSnapshot();

    expect(snapshot.status).toBe("done");
    expect(snapshot.output?.reason).toBe("error");
  });

  it("should transition to left final state on LEAVE", () => {
    const actor = makeActor();

    actor.send({ type: "LEAVE" });

    const snapshot = actor.getSnapshot();

    expect(snapshot.status).toBe("done");
    expect(snapshot.output?.reason).toBe("left");
  });

  it("should clear messages on CLEAR", () => {
    const actor = makeActor();

    actor.send({
      messages: [makeMessage()],
      participants: [],
      type: "SOCKET_INIT",
    });
    actor.send({ type: "CLEAR" });

    expect(actor.getSnapshot().context.messages).toStrictEqual([]);
  });
});
