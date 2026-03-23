"use client";

import { useThrottler } from "@tanstack/react-pacer";
import { useRouter } from "next/navigation";
import PartySocketClient from "partysocket";
import {
  useCallback,
  useEffect,
  useOptimistic,
  useRef,
  useState,
  useTransition,
} from "react";
import { css } from "styled-system/css";

import { leaveRoom } from "@/app/_actions/leave-room";

import type {
  Message,
  Participant,
  ServerMessage,
} from "../../../../../party/types";

import { ConfirmDialog } from "./confirm-dialog";
import { DisplayNameForm } from "./display-name-form";
import { MessageInput } from "./message-input";
import { MessageList } from "./message-list";
import { ParticipantStrip } from "./participant-strip";
import { RoomHeader } from "./room-header";
import { TypingIndicator } from "./typing-indicator";

const TYPING_CLEAR_DELAY_MS = 3000;
const TYPING_THROTTLE_MS = 1000;

type PendingAction = "clear" | "exit" | null;

interface Props {
  displayName: null | string;
  id: string;
  name: string;
}

const copyRoomLink = () => {
  void navigator.clipboard.writeText(globalThis.location.href);
};

export const RoomClient = ({
  displayName: initialDisplayName,
  id,
  name,
}: Props) => {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [overrideDisplayName, setOverrideDisplayName] = useState<null | string>(
    null,
  );
  const resolvedDisplayName = overrideDisplayName ?? initialDisplayName;
  const [messages, setMessages] = useState<Message[]>([]);
  const [optimisticMessages, addOptimisticMessage] = useOptimistic(
    messages,
    (state, newMessage: Message) => [...state, newMessage],
  );
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [typingNames, setTypingNames] = useState<string[]>([]);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const socketRef = useRef<InstanceType<typeof PartySocketClient> | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!resolvedDisplayName) {
      return undefined;
    }

    const typingTimers = new Map<string, ReturnType<typeof setTimeout>>();

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
          const { authorDisplayName } = msg.message;
          const existing = typingTimers.get(authorDisplayName);

          if (existing !== undefined) {
            clearTimeout(existing);
            typingTimers.delete(authorDisplayName);
          }

          setTypingNames((prev) => prev.filter((n) => n !== authorDisplayName));
          setMessages((prev) => [...prev, msg.message]);

          break;
        }
        case "typing": {
          const { displayName } = msg;

          setTypingNames((prev) => {
            if (prev.includes(displayName)) {
              return prev;
            }

            return [...prev, displayName];
          });

          const existing = typingTimers.get(displayName);

          if (existing !== undefined) {
            clearTimeout(existing);
          }

          const timer = setTimeout(() => {
            setTypingNames((prev) => prev.filter((n) => n !== displayName));
            typingTimers.delete(displayName);
          }, TYPING_CLEAR_DELAY_MS);

          typingTimers.set(displayName, timer);

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

      for (const timer of typingTimers.values()) {
        clearTimeout(timer);
      }

      typingTimers.clear();
      setTypingNames([]);
    };
  }, [resolvedDisplayName, id, router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [optimisticMessages]);

  const handleJoin = useCallback((joinName: string) => {
    setOverrideDisplayName(joinName);
  }, []);

  const sendTypingThrottler = useThrottler(
    () => {
      socketRef.current?.send(JSON.stringify({ type: "typing" }));
    },
    { wait: TYPING_THROTTLE_MS },
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
    sendTypingThrottler.cancel();
    setInputValue("");
  };

  const handleClearConfirmed = () => {
    socketRef.current?.send(JSON.stringify({ type: "clear" }));
    setMessages([]);
    setPendingAction(null);
  };

  const handleExitConfirmed = () => {
    socketRef.current?.send(JSON.stringify({ type: "leave" }));
    socketRef.current?.close();
    void leaveRoom({ roomId: id });
    router.push("/");
  };

  const handleConfirmCancel = () => {
    setPendingAction(null);
  };

  if (!resolvedDisplayName) {
    return <DisplayNameForm onJoin={handleJoin} roomId={id} />;
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
      <RoomHeader
        id={id}
        name={name}
        onClear={() => {
          setPendingAction("clear");
        }}
        onCopyLink={copyRoomLink}
        onExit={() => {
          setPendingAction("exit");
        }}
      />
      <ParticipantStrip
        displayName={resolvedDisplayName}
        participants={participants}
      />
      <TypingIndicator names={typingNames} />
      <MessageList
        bottomRef={bottomRef}
        displayName={resolvedDisplayName}
        messages={optimisticMessages}
      />
      <MessageInput
        onSend={sendMessage}
        onTyping={() => {
          sendTypingThrottler.maybeExecute();
        }}
        setValue={setInputValue}
        value={inputValue}
      />
      {pendingAction === "clear" ? (
        <ConfirmDialog
          description="This will remove all messages for everyone in the room. This cannot be undone."
          onCancel={handleConfirmCancel}
          onConfirm={handleClearConfirmed}
          title="Clear Chat?"
        />
      ) : null}
      {pendingAction === "exit" ? (
        <ConfirmDialog
          description="You will leave the room. You can rejoin at any time."
          onCancel={handleConfirmCancel}
          onConfirm={handleExitConfirmed}
          title="Exit Room?"
        />
      ) : null}
    </div>
  );
};
