"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { css } from "styled-system/css";
import * as v from "valibot";

import { joinRoom } from "@/app/_actions/join-room";
import { useAppForm } from "@/lib/form";
import { displayNameSchema } from "@/lib/schemas";

interface Props {
  roomId: string;
}

const formSchema = v.object({ displayName: displayNameSchema });

export const DisplayNameForm = ({ roomId }: Props) => {
  const router = useRouter();
  const [serverError, setServerError] = useState<null | string>(null);

  const form = useAppForm({
    defaultValues: { displayName: "" },
    onSubmit: async ({ value }) => {
      setServerError(null);
      const result = await joinRoom({ displayName: value.displayName, roomId });

      if (result.serverError) {
        setServerError("Something went wrong. Please try again.");

        return;
      }

      router.push(`/r/${roomId}`);
    },
    validators: {
      onSubmit: formSchema,
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
                placeholder="e.g. Ada"
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
