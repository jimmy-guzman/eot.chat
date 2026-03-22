"use client";

import { useTransition } from "react";
import { css } from "styled-system/css";

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
        backgroundColor: "bg",
        display: "flex",
        justifyContent: "center",
        minHeight: "100vh",
        padding: "6",
      })}
    >
      <div
        className={css({
          backgroundColor: "white",
          borderRadius: "lg",
          boxShadow: "lg",
          maxWidth: "400px",
          padding: "8",
          width: "100%",
        })}
      >
        <h1
          className={css({
            color: "ink",
            fontSize: "1.5rem",
            fontWeight: "800",
            marginBottom: "2",
          })}
        >
          Join the room
        </h1>
        <p
          className={css({
            color: "ink",
            fontSize: "0.875rem",
            marginBottom: "6",
            opacity: 0.6,
          })}
        >
          What should we call you?
        </p>

        <form onSubmit={handleSubmit}>
          <div className={css({ marginBottom: "4" })}>
            <label
              className={css({
                color: "ink",
                display: "block",
                fontSize: "0.875rem",
                fontWeight: "700",
                marginBottom: "2",
              })}
              htmlFor="displayName"
            >
              Your name
            </label>
            <input
              className={css({
                _focus: { borderColor: "cobalt" },
                backgroundColor: "bg",
                border: "2px solid token(colors.soft-pink)",
                borderRadius: "sm",
                color: "ink",
                fontSize: "1rem",
                outline: "none",
                padding: "3",
                width: "100%",
              })}
              id="displayName"
              name="displayName"
              placeholder="e.g. Ada"
              required
              type="text"
            />
          </div>

          <button
            className={css({
              _disabled: { cursor: "not-allowed", opacity: 0.5 },
              _hover: { backgroundColor: "cobalt", boxShadow: "md" },
              backgroundColor: "cobalt",
              border: "none",
              borderRadius: "full",
              color: "white",
              cursor: "pointer",
              fontSize: "1rem",
              fontWeight: "700",
              padding: "3 6",
              width: "100%",
            })}
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
