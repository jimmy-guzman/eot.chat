import type { Message, Participant } from "@party/types";

import { ServerMessageSchema } from "@party/types";
import { Schema } from "effect";
import PartySocketClient from "partysocket";
import { assign, enqueueActions, fromCallback, setup } from "xstate";

import { env } from "@/env";

export type StatusNotification =
  | null
  | { displayName: string; type: "cleared" }
  | { displayName: string; type: "entered" }
  | { displayName: string; type: "exited" }
  | { names: string[]; type: "typing" };

interface RoomContext {
  activeNotification: StatusNotification;
  displayName: string;
  exitReason: "error" | "left" | null;
  id: string;
  messages: Message[];
  participants: Participant[];
  typingNames: string[];
}

interface RoomInput {
  displayName: string;
  id: string;
}

interface RoomOutput {
  reason: "error" | "left";
}

export type SocketEvent =
  | { body: string; optimisticId: string; type: "SEND_MESSAGE" }
  | { displayName: string; type: "JOIN" }
  | { type: "CLEAR" }
  | { type: "LEAVE" }
  | { type: "TYPING" };

type RoomEvent =
  | { body: string; optimisticId: string; type: "SEND_MESSAGE" }
  | { displayName: string; participants: Participant[]; type: "SOCKET_LEFT" }
  | { displayName: string; type: "SOCKET_CLEARED" }
  | { displayName: string; type: "SOCKET_TYPING" }
  | { displayName: string; type: "TYPING_EXPIRED" }
  | { message: Message; type: "SOCKET_MESSAGE" }
  | { messages: Message[]; participants: Participant[]; type: "SOCKET_INIT" }
  | {
      participant: Participant;
      participants: Participant[];
      type: "SOCKET_JOINED";
    }
  | { type: "CLEAR" }
  | { type: "LEAVE" }
  | { type: "SOCKET_ERROR" }
  | { type: "STATUS_EXPIRED" }
  | { type: "TYPING" };

const STATUS_NOTIFICATION_DURATION_MS = 3000;

const decodeServerMessage = Schema.decodeUnknownSync(ServerMessageSchema);

const socketActor = fromCallback<
  SocketEvent,
  { displayName: string; id: string }
>(({ input, receive, sendBack }) => {
  const socket = new PartySocketClient({
    host: env.NEXT_PUBLIC_PARTYKIT_HOST,
    party: "main",
    room: input.id,
  });

  const onOpen = () => {
    socket.send(
      JSON.stringify({ displayName: input.displayName, type: "join" }),
    );
  };

  const onMessage = (event: MessageEvent<string>) => {
    let raw: unknown;

    try {
      raw = JSON.parse(event.data) as unknown;
    } catch {
      return;
    }

    let msg;

    try {
      msg = decodeServerMessage(raw);
    } catch {
      return;
    }

    switch (msg.type) {
      case "cleared": {
        sendBack({ displayName: msg.displayName, type: "SOCKET_CLEARED" });

        break;
      }
      case "error": {
        sendBack({ type: "SOCKET_ERROR" });

        break;
      }
      case "init": {
        sendBack({
          messages: [...msg.messages],
          participants: [...msg.participants],
          type: "SOCKET_INIT",
        });

        break;
      }
      case "joined": {
        sendBack({
          participant: msg.participant,
          participants: [...msg.participants],
          type: "SOCKET_JOINED",
        });

        break;
      }
      case "left": {
        sendBack({
          displayName: msg.displayName,
          participants: [...msg.participants],
          type: "SOCKET_LEFT",
        });

        break;
      }
      case "message": {
        sendBack({ message: msg.message, type: "SOCKET_MESSAGE" });

        break;
      }
      case "typing": {
        sendBack({ displayName: msg.displayName, type: "SOCKET_TYPING" });

        break;
      }
      default: {
        break;
      }
    }
  };

  socket.addEventListener("open", onOpen);
  socket.addEventListener("message", onMessage);

  receive((event) => {
    switch (event.type) {
      case "CLEAR": {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: "clear" }));
        }

        break;
      }
      case "JOIN": {
        socket.send(
          JSON.stringify({ displayName: event.displayName, type: "join" }),
        );

        break;
      }
      case "LEAVE": {
        socket.send(JSON.stringify({ type: "leave" }));

        break;
      }
      case "SEND_MESSAGE": {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ body: event.body, type: "message" }));
        }

        break;
      }
      case "TYPING": {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: "typing" }));
        }

        break;
      }
      default: {
        break;
      }
    }
  });

  return () => {
    socket.removeEventListener("open", onOpen);
    socket.removeEventListener("message", onMessage);
    socket.send(JSON.stringify({ type: "leave" }));
    socket.close();
  };
});

export const roomMachine = setup({
  actors: { socketActor },
  types: {
    context: {} as RoomContext,
    events: {} as RoomEvent,
    input: {} as RoomInput,
    output: {} as RoomOutput,
  },
}).createMachine({
  context: ({ input }) => {
    return {
      activeNotification: null,
      displayName: input.displayName,
      exitReason: null,
      id: input.id,
      messages: [],
      participants: [],
      typingNames: [],
    };
  },
  initial: "connected",
  output: ({ context }) => ({
    reason: context.exitReason ?? "left",
  }),
  states: {
    connected: {
      invoke: {
        id: "socket",
        input: ({ context }) => {
          return { displayName: context.displayName, id: context.id };
        },
        src: "socketActor",
      },
      on: {
        CLEAR: {
          actions: enqueueActions(({ enqueue }) => {
            enqueue.assign({ messages: [] });
            enqueue.sendTo("socket", { type: "CLEAR" });
          }),
        },
        LEAVE: {
          actions: assign({ exitReason: "left" }),
          target: "left",
        },
        SEND_MESSAGE: {
          actions: enqueueActions(({ context, enqueue, event }) => {
            const optimistic: Message = {
              authorDisplayName: context.displayName,
              id: event.optimisticId,
              rawInput: event.body,
              sentAt: new Date().toISOString(),
            };

            enqueue.assign({
              messages: ({ context: ctx }) => [...ctx.messages, optimistic],
            });
            enqueue.sendTo("socket", {
              body: event.body,
              optimisticId: event.optimisticId,
              type: "SEND_MESSAGE",
            });
          }),
        },
        SOCKET_CLEARED: {
          actions: enqueueActions(({ enqueue, event }) => {
            enqueue.assign({ messages: [] });
            enqueue.cancel("status-notification");
            enqueue.assign({
              activeNotification: {
                displayName: event.displayName,
                type: "cleared",
              },
            });
            enqueue.raise(
              { type: "STATUS_EXPIRED" },
              {
                delay: STATUS_NOTIFICATION_DURATION_MS,
                id: "status-notification",
              },
            );
          }),
        },
        SOCKET_ERROR: {
          actions: assign({ exitReason: "error" }),
          target: "error",
        },
        SOCKET_INIT: {
          actions: assign({
            messages: ({ event }) => event.messages,
            participants: ({ event }) => event.participants,
          }),
        },
        SOCKET_JOINED: {
          actions: enqueueActions(({ enqueue, event }) => {
            enqueue.assign({ participants: ({ event: e }) => e.participants });
            enqueue.cancel("status-notification");
            enqueue.assign({
              activeNotification: {
                displayName: event.participant.displayName,
                type: "entered",
              },
            });
            enqueue.raise(
              { type: "STATUS_EXPIRED" },
              {
                delay: STATUS_NOTIFICATION_DURATION_MS,
                id: "status-notification",
              },
            );
          }),
        },
        SOCKET_LEFT: {
          actions: enqueueActions(({ enqueue, event }) => {
            enqueue.assign({ participants: ({ event: e }) => e.participants });
            enqueue.cancel("status-notification");
            enqueue.assign({
              activeNotification: {
                displayName: event.displayName,
                type: "exited",
              },
            });
            enqueue.raise(
              { type: "STATUS_EXPIRED" },
              {
                delay: STATUS_NOTIFICATION_DURATION_MS,
                id: "status-notification",
              },
            );
          }),
        },
        SOCKET_MESSAGE: {
          actions: enqueueActions(({ enqueue, event }) => {
            enqueue.cancel(`typing-${event.message.authorDisplayName}`);
            enqueue.assign({
              typingNames: ({ context }) => {
                return context.typingNames.filter(
                  (n) => n !== event.message.authorDisplayName,
                );
              },
            });
            enqueue.assign({
              messages: ({ context }) => {
                const idx = context.messages.findIndex((m) => {
                  return (
                    m.id.startsWith("optimistic-") &&
                    m.rawInput === event.message.rawInput &&
                    m.authorDisplayName === context.displayName
                  );
                });

                if (idx !== -1) {
                  const next = [...context.messages];

                  next[idx] = event.message;

                  return next;
                }

                return [...context.messages, event.message];
              },
            });
          }),
        },
        SOCKET_TYPING: {
          actions: enqueueActions(({ enqueue, event }) => {
            enqueue.cancel(`typing-${event.displayName}`);
            enqueue.assign({
              typingNames: ({ context }) => {
                if (context.typingNames.includes(event.displayName)) {
                  return context.typingNames;
                }

                return [...context.typingNames, event.displayName];
              },
            });
            enqueue.raise(
              { displayName: event.displayName, type: "TYPING_EXPIRED" },
              { delay: 3000, id: `typing-${event.displayName}` },
            );
          }),
        },
        STATUS_EXPIRED: {
          actions: assign({ activeNotification: null }),
        },
        TYPING: {
          actions: enqueueActions(({ enqueue }) => {
            enqueue.sendTo("socket", { type: "TYPING" });
          }),
        },
        TYPING_EXPIRED: {
          actions: assign({
            typingNames: ({ context, event }) => {
              return context.typingNames.filter((n) => n !== event.displayName);
            },
          }),
        },
      },
    },
    error: {
      type: "final",
    },
    left: {
      type: "final",
    },
  },
});
