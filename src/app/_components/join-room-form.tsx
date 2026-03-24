"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { css } from "styled-system/css";

import { joinRoom } from "@/app/_actions/join-room";
import { useAppForm } from "@/lib/form";
import { joinRoomSchema } from "@/lib/schemas";

interface Props {
  initialJoinCode?: string;
}

export const JoinRoomForm = ({ initialJoinCode = "" }: Props) => {
  const router = useRouter();
  const [serverError, setServerError] = useState<null | string>(null);

  const form = useAppForm({
    defaultValues: { displayName: "", joinCode: initialJoinCode },
    onSubmit: async ({ value }) => {
      setServerError(null);
      const result = await joinRoom({
        displayName: value.displayName,
        joinCode: value.joinCode,
      });

      if (result.serverError) {
        setServerError("Room code not found. Check the code and try again.");

        return;
      }

      const roomId = result.data?.roomId;

      if (!roomId) {
        setServerError("Room code not found. Check the code and try again.");

        return;
      }

      router.push(`/r/${roomId}`);
    },
    validators: {
      onSubmit: joinRoomSchema,
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void form.handleSubmit();
      }}
    >
      <div className={css({ marginBottom: "4" })}>
        <form.AppField name="joinCode">
          {(field) => {
            return (
              <field.TextField
                autoComplete="off"
                label="Room code"
                placeholder="e.g. 8k3p2q7w"
              />
            );
          }}
        </form.AppField>
      </div>

      <div className={css({ marginBottom: "6" })}>
        <form.AppField name="displayName">
          {(field) => {
            return (
              <field.TextField
                autoComplete="nickname"
                label="Your name"
                placeholder="e.g. Alice"
              />
            );
          }}
        </form.AppField>
      </div>

      {serverError ? (
        <p
          aria-live="polite"
          className={css({
            color: "error-text",
            fontSize: "sm",
            marginBottom: "4",
          })}
        >
          {serverError}
        </p>
      ) : null}

      <form.AppForm>
        <form.SubmitButton label="Join Room" />
      </form.AppForm>
    </form>
  );
};
