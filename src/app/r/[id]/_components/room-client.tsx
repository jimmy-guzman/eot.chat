"use client";

import { ROOM_EXPIRY_MS } from "@party/types";
import { useThrottler } from "@tanstack/react-pacer";
import { useMachine, useSelector } from "@xstate/react";
import { nanoid } from "nanoid";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { css } from "styled-system/css";

import { leaveRoom } from "@/app/_actions/leave-room";
import { formatDuration } from "@/lib/format-duration";

import { ConfirmDialog } from "./confirm-dialog";
import { MessageInput } from "./message-input";
import { MessageList } from "./message-list";
import { ParticipantStrip } from "./participant-strip";
import { RoomHeader } from "./room-header";
import { roomMachine } from "./room-machine";
import { StatusBar } from "./status-bar";

const TYPING_THROTTLE_MS = 1000;

const connectingShellClass = css({
  alignItems: "center",
  display: "flex",
  flex: "1",
  flexDirection: "column",
  justifyContent: "center",
});

const connectingTextClass = css({
  color: "base-content-muted",
  fontSize: "sm",
  textAlign: "center",
});

const roomChromeClass = css({
  display: "flex",
  flex: "1",
  flexDirection: "column",
  minHeight: "0",
});

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

  const initialized = useSelector(actorRef, (s) => s.context.initialized);
  const messages = useSelector(actorRef, (s) => s.context.messages);
  const participants = useSelector(actorRef, (s) => s.context.participants);

  const statusNotification = useSelector(actorRef, (s) => {
    if (s.context.activeNotification) return s.context.activeNotification;

    if (s.context.typingNames.length > 0) {
      return { names: s.context.typingNames, type: "typing" as const };
    }

    return null;
  });

  const [inputValue, setInputValue] = useState("");
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (snapshot.status === "done") {
      const { reason } = snapshot.output;

      void leaveRoom({ roomId: id });

      if (reason === "left") {
        router.push("/");
      }
    }
  }, [snapshot.status, snapshot.output, id, router]);

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
        height: "100dvh",
      })}
    >
      {initialized ? (
        <div className={roomChromeClass}>
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
          <ParticipantStrip
            displayName={displayName}
            participants={participants}
          />
          <StatusBar notification={statusNotification} />
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
          <ConfirmDialog
            description="This will remove all messages for everyone in the room. This cannot be undone."
            onCancel={handleConfirmCancel}
            onConfirm={handleClearConfirmed}
            open={pendingAction === "clear"}
            title="Clear Chat?"
          />
          <ConfirmDialog
            description={
              participants.length === 1
                ? `You will leave the room. It will be deleted in ${formatDuration(ROOM_EXPIRY_MS)} if no one rejoins.`
                : "You will leave the room. You can rejoin at any time."
            }
            onCancel={handleConfirmCancel}
            onConfirm={handleExitConfirmed}
            open={pendingAction === "exit"}
            title="Exit Room?"
          />
        </div>
      ) : (
        <div aria-live="polite" className={connectingShellClass} role="status">
          <p className={connectingTextClass}>Connecting…</p>
        </div>
      )}
    </div>
  );
};
