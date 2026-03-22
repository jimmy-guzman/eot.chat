"use client";

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
import { css, cx } from "styled-system/css";
import { badge, button, input } from "styled-system/recipes";

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
  const [inputValue, setInputValue] = useState("");
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
        case "cleared": {
          setMessages([]);

          break;
        }
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

  const sendMessage = () => {
    const body = inputValue.trim();

    if (!body || !socketRef.current || !resolvedDisplayName) return;

    const optimistic: Message = {
      authorDisplayName: resolvedDisplayName,
      id: `optimistic-${Date.now().toString()}`,
      rawInput: body,
      sentAt: new Date().toISOString(),
    };

    startTransition(() => {
      addOptimisticMessage(optimistic);
    });
    socketRef.current.send(JSON.stringify({ body, type: "message" }));
    setInputValue("");
  };

  const handleSend = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    sendMessage();
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleExit = () => {
    socketRef.current?.send(JSON.stringify({ type: "leave" }));
    socketRef.current?.close();
    router.push("/");
  };

  const handleClear = () => {
    socketRef.current?.send(JSON.stringify({ type: "clear" }));
    setMessages([]);
  };

  if (!resolvedDisplayName) {
    return <DisplayNameForm onJoin={handleJoin} />;
  }

  return (
    <div
      className={css({
        backgroundColor: "base-100",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
      })}
    >
      {/* Header */}
      <header
        className={css({
          backgroundColor: "base-200",
          borderBottom: "1px solid token(colors.base-300)",
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
              color: "accent",
              fontSize: "lg",
              fontWeight: "extrabold",
              letterSpacing: "display",
            })}
          >
            {name}
          </h1>
          <div className={css({ display: "flex", gap: "2" })}>
            <button
              className={button({ size: "sm", variant: "secondary" })}
              onClick={copyRoomLink}
              type="button"
            >
              Copy Link
            </button>
            <button
              className={button({ size: "sm", variant: "ghost" })}
              onClick={handleClear}
              type="button"
            >
              Clear Chat
            </button>
            <button
              className={button({ size: "sm", variant: "danger" })}
              onClick={handleExit}
              type="button"
            >
              Exit Room
            </button>
          </div>
        </div>
        <p
          className={css({
            color: "base-content",
            fontSize: "xs",
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
            backgroundColor: "base-200",
            borderBottom: "1px solid token(colors.base-300)",
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
                className={badge({
                  variant:
                    p.displayName === resolvedDisplayName
                      ? "active"
                      : "default",
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
          <div
            className={css({
              alignItems: "center",
              display: "flex",
              flexDirection: "column",
              gap: "3",
              justifyContent: "center",
              paddingY: "10",
            })}
          >
            <p
              className={css({
                color: "base-content",
                fontSize: "sm",
                opacity: 0.5,
                textAlign: "center",
              })}
            >
              The room is waiting.
            </p>
          </div>
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
                  alignSelf: isOwn ? "flex-end" : "flex-start",
                  display: "flex",
                  flexDirection: "column",
                  gap: "1",
                })}
                key={msg.id}
              >
                <span
                  className={css({
                    color: "base-content",
                    fontSize: "xs",
                    fontWeight: "bold",
                    opacity: 0.5,
                    paddingX: "1",
                  })}
                >
                  {msg.authorDisplayName}
                </span>
                <div
                  className={css({
                    backgroundColor: isOwn ? "base-300" : "base-200",
                    borderRadius: "md",
                    boxShadow: "sm",
                    maxWidth: "bubble",
                    padding: "3",
                    width: "fit-content",
                  })}
                >
                  <p
                    className={css({
                      color: "base-content",
                      fontSize: "base",
                      lineHeight: "body",
                      margin: "0",
                    })}
                  >
                    {msg.rawInput}
                  </p>
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
          backgroundColor: "base-200",
          borderTop: "1px solid token(colors.base-300)",
          display: "flex",
          gap: "3",
          padding: "4 5",
        })}
        onSubmit={handleSend}
      >
        <textarea
          className={cx(
            input(),
            css({ flex: "1", resize: "none", width: "auto" }),
          )}
          onChange={(e) => {
            setInputValue(e.target.value);
          }}
          onKeyDown={handleInputKeyDown}
          placeholder="Send anything..."
          rows={1}
          value={inputValue}
        />
        <button
          className={button({ variant: "primary" })}
          disabled={!inputValue.trim()}
          type="submit"
        >
          Send
        </button>
      </form>
    </div>
  );
};
