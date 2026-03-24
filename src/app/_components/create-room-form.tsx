"use client";

import { useState } from "react";
import { css } from "styled-system/css";

import { createRoom } from "@/app/_actions/create-room";
import { useAppForm } from "@/lib/form";
import { createRoomSchema } from "@/lib/schemas";

export const CreateRoomForm = () => {
  const [serverError, setServerError] = useState<null | string>(null);

  const form = useAppForm({
    defaultValues: { displayName: "", roomName: "" },
    onSubmit: async ({ value }) => {
      setServerError(null);
      const result = await createRoom(value);

      if (result.serverError) {
        setServerError("Something went wrong. Please try again.");
      }
    },
    validators: {
      onSubmit: createRoomSchema,
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
        <form.AppField name="roomName">
          {(field) => {
            return (
              <field.TextField
                autoComplete="off"
                label="Room name"
                placeholder="e.g. Friday Standup"
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
        <form.SubmitButton label="Create a Room" />
      </form.AppForm>
    </form>
  );
};
