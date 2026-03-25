"use client";

import { useRouter } from "next/navigation";
import { useQueryState } from "nuqs";
import { useState } from "react";
import { css } from "styled-system/css";

import { joinRoom } from "@/app/_actions/join-room";
import { useAppForm } from "@/lib/form";
import { joinRoomSchema } from "@/lib/schemas";

interface Props {
  roomId: string;
}

export const DisplayNameForm = ({ roomId }: Props) => {
  const router = useRouter();
  const [initialDisplayName] = useQueryState("displayName");
  const [serverError, setServerError] = useState<null | string>(null);

  const form = useAppForm({
    defaultValues: { displayName: initialDisplayName ?? "", joinCode: roomId },
    onSubmit: async ({ value }) => {
      setServerError(null);
      const result = await joinRoom({
        displayName: value.displayName,
        joinCode: roomId,
      });

      if (result.serverError || !result.data?.roomId) {
        setServerError("Something went wrong. Please try again.");

        return;
      }

      router.push(`/r/${result.data.roomId}`);
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
        <form.SubmitButton label="Enter Room" />
      </form.AppForm>
    </form>
  );
};
