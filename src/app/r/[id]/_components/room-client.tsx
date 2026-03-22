"use client";

import { JSONUIProvider, Renderer } from "@json-render/react";
import { useRouter } from "next/navigation";
import PartySocketClient from "partysocket";
import {
  useCallback,
  useEffect,
  useOptimistic,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
} from "react";
import { css } from "styled-system/css";

import { registry } from "@/catalog/registry";

import type {
  Message,
  Participant,
  ServerMessage,
} from "../../../../../party/types";

import { DisplayNameForm } from "./display-name-form";

interface Props {
  id: string;
  name: string;
}

const actionButtonStyle = css({
  _hover: { boxShadow: "md" },
  backgroundColor: "mint",
  border: "none",
  borderRadius: "sm",
  color: "ink",
  cursor: "pointer",
  fontSize: "0.875rem",
  fontWeight: "700",
  padding: "2 3",
});

const getStoredDisplayName = (id: string) => {
  try {
    return sessionStorage.getItem(`room:${id}:displayName`);
  } catch {
    return null;
  }
};

const setStoredDisplayName = (id: string, displayName: string) => {
  try {
    sessionStorage.setItem(`room:${id}:displayName`, displayName);
  } catch {
    // intentionally ignored — sessionStorage may be unavailable
  }
};

const makeSpec = (type: string, props: Record<string, unknown>) => {
  return { elements: { root: { props, type } }, root: "root" };
};

const copyRoomLink = () => {
  void navigator.clipboard.writeText(globalThis.location.href);
};

const unsubscribe = () => undefined;
const noop = () => unsubscribe;
const serverSnapshot = () => null;
const makeClientSnapshot = (id: string) => () => getStoredDisplayName(id);

export const RoomClient = ({ id, name }: Props) => {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const displayName = useSyncExternalStore(
    noop,
    makeClientSnapshot(id),
    serverSnapshot,
  );
  const [overrideDisplayName, setOverrideDisplayName] = useState<null | string>(
    null,
  );
  const resolvedDisplayName = overrideDisplayName ?? displayName;
  const [messages, setMessages] = useState<Message[]>([]);
  const [optimisticMessages, addOptimisticMessage] = useOptimistic(
    messages,
    (state, newMessage: Message) => [...state, newMessage],
  );
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [input, setInput] = useState("");
  const socketRef = useRef<InstanceType<typeof PartySocketClient> | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!resolvedDisplayName) {
      return undefined;
    }

    const socket = new PartySocketClient({
      host: process.env.NEXT_PUBLIC_PARTYKIT_HOST ?? "localhost:1999",
      party: "main",
      room: id,
    });

    socketRef.current = socket;

    const onOpen = () => {
      socket.send(
        JSON.stringify({ displayName: resolvedDisplayName, type: "join" }),
      );
    };

    const onMessage = (event: MessageEvent<string>) => {
      let msg: ServerMessage;

      try {
        msg = JSON.parse(event.data) as ServerMessage;
      } catch {
        return;
      }

      switch (msg.type) {
        case "error": {
          router.push("/");

          break;
        }
        case "init": {
          setMessages([...msg.messages]);
          setParticipants([...msg.participants]);

          break;
        }
        case "joined": {
          setParticipants([...msg.participants]);

          break;
        }
        case "left": {
          setParticipants([...msg.participants]);

          break;
        }
        case "message": {
          setMessages((prev) => [...prev, msg.message]);

          break;
        }
        default: {
          break;
        }
      }
    };

    socket.addEventListener("open", onOpen);
    socket.addEventListener("message", onMessage);

    return () => {
      socket.removeEventListener("open", onOpen);
      socket.removeEventListener("message", onMessage);
      socket.close();
      socketRef.current = null;
    };
  }, [resolvedDisplayName, id, router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [optimisticMessages]);

  const handleJoin = useCallback(
    (joinName: string) => {
      setStoredDisplayName(id, joinName);
      setOverrideDisplayName(joinName);
    },
    [id],
  );

  const handleSend = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const body = input.trim();

    if (!body || !socketRef.current || !resolvedDisplayName) return;

    const optimistic: Message = {
      authorDisplayName: resolvedDisplayName,
      component: { props: { body }, type: "TextMessage" },
      id: `optimistic-${Date.now().toString()}`,
      rawInput: body,
      sentAt: new Date().toISOString(),
    };

    startTransition(() => {
      addOptimisticMessage(optimistic);
    });
    socketRef.current.send(JSON.stringify({ body, type: "message" }));
    setInput("");
  };

  const handleExit = () => {
    socketRef.current?.send(JSON.stringify({ type: "leave" }));
    socketRef.current?.close();
    router.push("/");
  };

  if (!resolvedDisplayName) {
    return <DisplayNameForm onJoin={handleJoin} />;
  }

  return (
    <div
      className={css({
        backgroundColor: "bg",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
      })}
    >
      {/* Header */}
      <header
        className={css({
          backgroundColor: "white",
          borderBottom: "1px solid token(colors.soft-pink)",
          padding: "4 5",
        })}
      >
        <div
          className={css({
            alignItems: "center",
            display: "flex",
            gap: "3",
            justifyContent: "space-between",
          })}
        >
          <h1
            className={css({
              color: "ink",
              fontSize: "1rem",
              fontWeight: "800",
            })}
          >
            You Are Now in Room:{" "}
            <span className={css({ color: "cobalt" })}>{name}</span>
          </h1>
          <div className={css({ display: "flex", gap: "2" })}>
            <button
              className={actionButtonStyle}
              onClick={copyRoomLink}
              type="button"
            >
              Copy Link
            </button>
            <button
              className={css({
                _hover: { boxShadow: "md" },
                backgroundColor: "soft-pink",
                border: "none",
                borderRadius: "sm",
                color: "ink",
                cursor: "pointer",
                fontSize: "0.875rem",
                fontWeight: "700",
                padding: "2 3",
              })}
              onClick={handleExit}
              type="button"
            >
              Exit Room
            </button>
          </div>
        </div>
        <p
          className={css({
            color: "ink",
            fontSize: "0.75rem",
            marginTop: "1",
            opacity: 0.5,
          })}
        >
          {`https://salita.chat/r/${id}`}
        </p>
      </header>

      {/* Participants */}
      {participants.length > 0 ? (
        <ul
          aria-label="Participants"
          className={css({
            backgroundColor: "white",
            borderBottom: "1px solid token(colors.soft-pink)",
            display: "flex",
            gap: "2",
            listStyle: "none",
            margin: "0",
            padding: "2 5",
          })}
        >
          {participants.map((p) => {
            return (
              <li
                className={css({
                  backgroundColor:
                    p.displayName === resolvedDisplayName
                      ? "cobalt"
                      : "lavender",
                  borderRadius: "full",
                  color:
                    p.displayName === resolvedDisplayName ? "white" : "ink",
                  fontSize: "0.75rem",
                  fontWeight: "700",
                  padding: "1 3",
                })}
                key={p.displayName}
              >
                {p.displayName}
              </li>
            );
          })}
        </ul>
      ) : null}

      {/* Messages */}
      <div
        className={css({
          flex: "1",
          overflowY: "auto",
          padding: "5",
        })}
      >
        {optimisticMessages.length === 0 ? (
          <p
            className={css({
              color: "ink",
              fontSize: "0.875rem",
              opacity: 0.4,
              textAlign: "center",
            })}
          >
            No messages yet. Say something!
          </p>
        ) : null}
        <div
          className={css({
            display: "flex",
            flexDirection: "column",
            gap: "4",
          })}
        >
          {optimisticMessages.map((msg) => {
            const isOwn = msg.authorDisplayName === resolvedDisplayName;

            return (
              <div
                className={css({
                  alignItems: "flex-start",
                  alignSelf: isOwn ? "flex-start" : "flex-end",
                  display: "flex",
                  flexDirection: "column",
                  gap: "1",
                })}
                key={msg.id}
              >
                <span
                  className={css({
                    color: "ink",
                    fontSize: "0.75rem",
                    fontWeight: "700",
                    opacity: 0.5,
                    paddingX: "1",
                  })}
                >
                  {msg.authorDisplayName}
                </span>
                <div
                  className={css({
                    backgroundColor: isOwn ? "powder-blue" : "white",
                    borderRadius: "md",
                    boxShadow: "sm",
                    maxWidth: "480px",
                    padding: "3",
                    width: "fit-content",
                  })}
                >
                  <JSONUIProvider registry={registry}>
                    <Renderer
                      registry={registry}
                      spec={makeSpec(
                        msg.component.type,
                        msg.component.props as Record<string, unknown>,
                      )}
                    />
                  </JSONUIProvider>
                </div>
              </div>
            );
          })}
        </div>
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        className={css({
          backgroundColor: "white",
          borderTop: "1px solid token(colors.soft-pink)",
          display: "flex",
          gap: "3",
          padding: "4 5",
        })}
        onSubmit={handleSend}
      >
        <input
          className={css({
            _focus: { borderColor: "cobalt" },
            backgroundColor: "bg",
            border: "2px solid token(colors.soft-pink)",
            borderRadius: "sm",
            color: "ink",
            flex: "1",
            fontSize: "1rem",
            outline: "none",
            padding: "3",
          })}
          onChange={(e) => {
            setInput(e.target.value);
          }}
          placeholder="Send anything..."
          type="text"
          value={input}
        />
        <button
          className={css({
            _disabled: { cursor: "not-allowed", opacity: 0.5 },
            _hover: { boxShadow: "md" },
            backgroundColor: "cobalt",
            border: "none",
            borderRadius: "full",
            color: "white",
            cursor: "pointer",
            fontSize: "1rem",
            fontWeight: "700",
            padding: "3 5",
          })}
          disabled={!input.trim()}
          type="submit"
        >
          Send
        </button>
      </form>
    </div>
  );
};
