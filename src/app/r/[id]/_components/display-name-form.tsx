"use client";

import { useTransition } from "react";
import { css, cx } from "styled-system/css";
import { button, input, label } from "styled-system/recipes";

interface Props {
  onJoin: (displayName: string) => void;
}

export const DisplayNameForm = ({ onJoin }: Props) => {
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const displayName = (
      e.currentTarget.elements.namedItem("displayName") as HTMLInputElement
    ).value.trim();

    if (!displayName) return;

    startTransition(() => {
      onJoin(displayName);
    });
  };

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
        className={css({
          backgroundColor: "base-200",
          borderRadius: "lg",
          boxShadow: "lg",
          maxWidth: "card",
          padding: "8",
          width: "100%",
        })}
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

        <form onSubmit={handleSubmit}>
          <div className={css({ marginBottom: "4" })}>
            <label
              className={cx(label(), css({ marginBottom: "2" }))}
              htmlFor="displayName"
            >
              Your name
            </label>
            <input
              className={input()}
              id="displayName"
              name="displayName"
              placeholder="e.g. Ada"
              required
              type="text"
            />
          </div>

          <button
            className={cx(
              button({ variant: "primary" }),
              css({ width: "100%" }),
            )}
            disabled={isPending}
            type="submit"
          >
            Enter Room
          </button>
        </form>
      </div>
    </main>
  );
};
