"use client";

import { css } from "styled-system/css";

import { createRoom } from "@/app/_actions/create-room";
import { useAppForm } from "@/lib/form";

export const CreateRoomForm = () => {
  const form = useAppForm({
    defaultValues: { displayName: "", roomName: "" },
    onSubmit: async ({ value }) => {
      await createRoom(value);
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
            return <field.TextField label="Your name" placeholder="e.g. Ada" />;
          }}
        </form.AppField>
      </div>

      <form.Subscribe selector={(state) => state.errors}>
        {(errors) => {
          const msg = errors.join(", ");

          return msg ? (
            <p
              className={css({
                color: "error",
                fontSize: "sm",
                marginBottom: "4",
              })}
            >
              {msg}
            </p>
          ) : null;
        }}
      </form.Subscribe>

      <form.AppForm>
        <form.SubmitButton label="Create a Room" />
      </form.AppForm>
    </form>
  );
};
