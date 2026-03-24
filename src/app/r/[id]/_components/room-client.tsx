"use client";

import { ROOM_EXPIRY_MS } from "@party/types";
import { useThrottler } from "@tanstack/react-pacer";
import { useMachine, useSelector } from "@xstate/react";
import { nanoid } from "nanoid";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { css } from "styled-system/css";

import { leaveRoom } from "@/app/_actions/leave-room";
import { rotateJoinCode } from "@/app/_actions/rotate-join-code";
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

type PendingAction = "clear" | "exit" | "rotate" | null;

interface Props {
  displayName: string;
  id: string;
  isRoomHost: boolean;
  joinCode: string;
  name: string;
  roomUrl: string;
  sessionId: string;
  sessionToken: string;
}

export const RoomClient = ({
  displayName,
  id,
  isRoomHost,
  joinCode,
  name,
  roomUrl,
  sessionId,
  sessionToken,
}: Props) => {
  const router = useRouter();
  const [snapshot, send, actorRef] = useMachine(roomMachine, {
    input: { displayName, id, sessionId, sessionToken },
  });

  const initialized = useSelector(actorRef, (s) => s.context.initialized);
  const currentDisplayName = useSelector(
    actorRef,
    (s) => s.context.displayName,
  );
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
  const [rotateSubmitting, setRotateSubmitting] = useState(false);
  const [rotateError, setRotateError] = useState<null | string>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (snapshot.status === "done") {
      const { reason } = snapshot.output;

      if (reason !== "replaced") {
        void leaveRoom({ roomId: id });
      }

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

  const handleRotateConfirmed = async () => {
    setRotateSubmitting(true);
    setRotateError(null);
    const result = await rotateJoinCode({ roomId: id });

    setRotateSubmitting(false);

    if (result.serverError) {
      setRotateError("Could not rotate code. Try again.");

      return;
    }

    setPendingAction(null);
    router.refresh();
  };

  const handleConfirmCancel = () => {
    setPendingAction(null);
    setRotateError(null);
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
            isRoomHost={isRoomHost}
            name={name}
            onClear={() => {
              setPendingAction("clear");
            }}
            onCopyJoinCode={() => {
              void navigator.clipboard.writeText(joinCode);
            }}
            onCopyRoomLink={() => {
              void navigator.clipboard.writeText(roomUrl);
            }}
            onExit={() => {
              setPendingAction("exit");
            }}
            onRotateJoinCode={() => {
              setRotateError(null);
              setPendingAction("rotate");
            }}
            roomUrl={roomUrl}
          />
          <ParticipantStrip
            displayName={currentDisplayName}
            participants={participants}
          />
          <StatusBar notification={statusNotification} />
          <MessageList
            bottomRef={bottomRef}
            displayName={currentDisplayName}
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
          <ConfirmDialog
            closeOnConfirm={false}
            confirmDisabled={rotateSubmitting}
            confirmLabel="Rotate"
            description={
              rotateError ? (
                <>
                  Anyone with the old join code will need the new code to join.{" "}
                  <span className={css({ color: "error-text" })}>
                    {rotateError}
                  </span>
                </>
              ) : (
                "Anyone with the old join code will need the new code to join."
              )
            }
            onCancel={handleConfirmCancel}
            onConfirm={handleRotateConfirmed}
            open={pendingAction === "rotate"}
            title="Rotate Join Code?"
          />
        </div>
      ) : snapshot.status === "done" &&
        snapshot.output.reason === "replaced" ? (
        <div aria-live="polite" className={connectingShellClass} role="status">
          <p className={connectingTextClass}>
            This room is open in another tab.
          </p>
        </div>
      ) : (
        <div aria-live="polite" className={connectingShellClass} role="status">
          <p className={connectingTextClass}>Connecting…</p>
        </div>
      )}
    </div>
  );
};
