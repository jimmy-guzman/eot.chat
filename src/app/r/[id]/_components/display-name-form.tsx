"use client";

import { useTransition } from "react";
import { css, cx } from "styled-system/css";
import { button, input } from "styled-system/recipes";

import { CatMotif } from "@/components/illustrations";

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
          backgroundColor: "surface",
          borderRadius: "lg",
          boxShadow: "lg",
          maxWidth: "card",
          padding: "8",
          position: "relative",
          width: "100%",
        })}
      >
        <h1
          className={css({
            color: "cobalt",
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
            color: "ink",
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
              className={css({
                color: "ink",
                display: "block",
                fontSize: "sm",
                fontWeight: "bold",
                marginBottom: "2",
              })}
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

        <div
          className={css({
            alignItems: "flex-end",
            display: "flex",
            justifyContent: "flex-end",
            marginTop: "6",
            pointerEvents: "none",
          })}
        >
          <CatMotif />
        </div>
      </div>
    </main>
  );
};
