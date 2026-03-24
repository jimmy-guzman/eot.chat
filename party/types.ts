import { Schema } from "effect";

export const ROOM_EXPIRY_MS = 60 * 60 * 1000;

export const ParticipantSchema = Schema.Struct({
  displayName: Schema.String,
  joinedAt: Schema.String,
  sessionId: Schema.String,
});

export const MessageSchema = Schema.Struct({
  authorDisplayName: Schema.String,
  id: Schema.String,
  rawInput: Schema.String,
  sentAt: Schema.String,
});

export const ClientMessageSchema = Schema.Union(
  Schema.Struct({ type: Schema.Literal("clear") }),
  Schema.Struct({
    displayName: Schema.String,
    sessionId: Schema.String,
    sessionToken: Schema.String,
    type: Schema.Literal("join"),
  }),
  Schema.Struct({ type: Schema.Literal("leave") }),
  Schema.Struct({ body: Schema.String, type: Schema.Literal("message") }),
  Schema.Struct({ type: Schema.Literal("typing") }),
);

export const ServerMessageSchema = Schema.Union(
  Schema.Struct({
    displayName: Schema.String,
    type: Schema.Literal("cleared"),
  }),
  Schema.Struct({
    messages: Schema.Array(MessageSchema),
    participants: Schema.Array(ParticipantSchema),
    type: Schema.Literal("init"),
  }),
  Schema.Struct({
    participant: ParticipantSchema,
    participants: Schema.Array(ParticipantSchema),
    type: Schema.Literal("joined"),
  }),
  Schema.Struct({
    message: MessageSchema,
    type: Schema.Literal("message"),
  }),
  Schema.Struct({
    displayName: Schema.String,
    participants: Schema.Array(ParticipantSchema),
    type: Schema.Literal("left"),
  }),
  Schema.Struct({
    reason: Schema.String,
    type: Schema.Literal("error"),
  }),
  Schema.Struct({
    displayName: Schema.String,
    type: Schema.Literal("typing"),
  }),
);

export const CreateRoomBodySchema = Schema.Struct({
  hostSecret: Schema.String,
  joinCode: Schema.String,
  name: Schema.String,
});

export const RegisterBodySchema = Schema.Struct({
  joinCode: Schema.String,
  roomId: Schema.String,
});

export const ResolveBodySchema = Schema.Struct({
  joinCode: Schema.String,
});

export const RotateJoinCodeBodySchema = Schema.Struct({
  hostSecret: Schema.String,
  newJoinCode: Schema.String,
});

export const UnregisterBodySchema = Schema.Struct({
  joinCode: Schema.String,
});

export type ClientMessage = Schema.Schema.Type<typeof ClientMessageSchema>;
export type Message = Schema.Schema.Type<typeof MessageSchema>;
export type Participant = Schema.Schema.Type<typeof ParticipantSchema>;
export type ServerMessage = Schema.Schema.Type<typeof ServerMessageSchema>;
