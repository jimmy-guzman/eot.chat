import { Schema } from "effect";

export const ParticipantSchema = Schema.Struct({
  displayName: Schema.String,
  joinedAt: Schema.String,
});

export const ComponentSchema = Schema.Struct({
  elements: Schema.Record({
    key: Schema.String,
    value: Schema.Struct({
      props: Schema.Record({ key: Schema.String, value: Schema.Unknown }),
      type: Schema.String,
    }),
  }),
  root: Schema.String,
});

export const MessageSchema = Schema.Struct({
  authorDisplayName: Schema.String,
  component: ComponentSchema,
  id: Schema.String,
  rawInput: Schema.String,
  sentAt: Schema.String,
});

export const ClientMessageSchema = Schema.Union(
  Schema.Struct({ type: Schema.Literal("clear") }),
  Schema.Struct({ displayName: Schema.String, type: Schema.Literal("join") }),
  Schema.Struct({ type: Schema.Literal("leave") }),
  Schema.Struct({ body: Schema.String, type: Schema.Literal("message") }),
);

export const ServerMessageSchema = Schema.Union(
  Schema.Struct({ type: Schema.Literal("cleared") }),
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
);

export type ClientMessage = Schema.Schema.Type<typeof ClientMessageSchema>;
export type Message = Schema.Schema.Type<typeof MessageSchema>;
export type Participant = Schema.Schema.Type<typeof ParticipantSchema>;
export type ServerMessage = Schema.Schema.Type<typeof ServerMessageSchema>;
