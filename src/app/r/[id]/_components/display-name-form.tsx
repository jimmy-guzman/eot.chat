"use client";

import { css, cx } from "styled-system/css";
import { card } from "styled-system/recipes";

import { joinRoom } from "@/app/_actions/join-room";
import { useAppForm } from "@/lib/form";

interface Props {
  onJoin: (displayName: string) => void;
  roomId: string;
}

export const DisplayNameForm = ({ onJoin, roomId }: Props) => {
  const form = useAppForm({
    defaultValues: { displayName: "" },
    onSubmit: async ({ value }) => {
      await joinRoom({ displayName: value.displayName, roomId });
      onJoin(value.displayName);
    },
  });

  return (
    <main
      className={css({
        alignItems: "center",
        backgroundColor: "base-100",
        display: "flex",
        justifyContent: "center",
        minHeight: "100vh",
        padding: "6",
      })}
    >
      <div
        className={cx(
          card(),
          css({ maxWidth: "card", padding: "8", width: "100%" }),
        )}
      >
        <h1
          className={css({
            color: "accent",
            fontSize: "2xl",
            fontWeight: "extrabold",
            letterSpacing: "display",
            marginBottom: "2",
          })}
        >
          Join the room
        </h1>
        <p
          className={css({
            color: "base-content",
            fontSize: "sm",
            lineHeight: "body",
            marginBottom: "6",
            opacity: 0.6,
          })}
        >
          What should we call you?
        </p>

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
                  <field.TextField label="Your name" placeholder="e.g. Ada" />
                );
              }}
            </form.AppField>
          </div>

          <form.AppForm>
            <form.SubmitButton label="Enter Room" />
          </form.AppForm>
        </form>
      </div>
    </main>
  );
};
