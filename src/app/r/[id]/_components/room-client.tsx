"use client";

import { useThrottler } from "@tanstack/react-pacer";
import { useMachine, useSelector } from "@xstate/react";
import { nanoid } from "nanoid";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { css } from "styled-system/css";

import { leaveRoom } from "@/app/_actions/leave-room";

import { ConfirmDialog } from "./confirm-dialog";
import { MessageInput } from "./message-input";
import { MessageList } from "./message-list";
import { ParticipantStrip } from "./participant-strip";
import { RoomHeader } from "./room-header";
import { roomMachine } from "./room-machine";
import { TypingIndicator } from "./typing-indicator";

const TYPING_THROTTLE_MS = 1000;

type PendingAction = "clear" | "exit" | null;

interface Props {
  displayName: string;
  id: string;
  name: string;
  roomUrl: string;
}

export const RoomClient = ({ displayName, id, name, roomUrl }: Props) => {
  const router = useRouter();
  const [snapshot, send, actorRef] = useMachine(roomMachine, {
    input: { displayName, id },
  });

  const messages = useSelector(actorRef, (s) => s.context.messages);
  const participants = useSelector(actorRef, (s) => s.context.participants);
  const typingNames = useSelector(actorRef, (s) => s.context.typingNames);

  const [inputValue, setInputValue] = useState("");
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (snapshot.status === "done") {
      void leaveRoom({ roomId: id });
      router.push("/");
    }
  }, [snapshot.status, id, router]);

  const sendTypingThrottler = useThrottler(
    () => {
      send({ type: "TYPING" });
    },
    { wait: TYPING_THROTTLE_MS },
  );

  const handleSendMessage = () => {
    const body = inputValue.trim();

    if (!body) return;

    send({
      body,
      optimisticId: `optimistic-${nanoid()}`,
      type: "SEND_MESSAGE",
    });
    sendTypingThrottler.cancel();
    setInputValue("");
  };

  const handleClearConfirmed = () => {
    send({ type: "CLEAR" });
    setPendingAction(null);
  };

  const handleExitConfirmed = () => {
    send({ type: "LEAVE" });
  };

  const handleConfirmCancel = () => {
    setPendingAction(null);
  };

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
        name={name}
        onClear={() => {
          setPendingAction("clear");
        }}
        onCopyLink={() => {
          void navigator.clipboard.writeText(globalThis.location.href);
        }}
        onExit={() => {
          setPendingAction("exit");
        }}
        roomUrl={roomUrl}
      />
      <ParticipantStrip displayName={displayName} participants={participants} />
      <TypingIndicator names={typingNames} />
      <MessageList
        bottomRef={bottomRef}
        displayName={displayName}
        messages={messages}
      />
      <MessageInput
        onSend={handleSendMessage}
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
