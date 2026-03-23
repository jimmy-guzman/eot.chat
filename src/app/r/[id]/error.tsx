"use client";

import Link from "next/link";
import { css, cx } from "styled-system/css";
import { button, card } from "styled-system/recipes";

interface Props {
  reset: () => void;
}

export default function RoomError({ reset }: Props) {
  return (
    <main
      className={css({
        alignItems: "center",
        backgroundColor: "base-100",
        display: "flex",
        justifyContent: "center",
        minHeight: "100dvh",
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
          Something went wrong
        </h1>
        <p
          className={css({
            color: "base-content-muted",
            fontSize: "sm",
            lineHeight: "body",
            marginBottom: "6",
          })}
        >
          Could not connect to the room. This is usually a temporary issue.
        </p>
        <div
          className={css({
            display: "flex",
            flexDirection: "column",
            gap: "3",
          })}
        >
          <button
            className={button({ size: "block", variant: "primary" })}
            onClick={reset}
            type="button"
          >
            Try again
          </button>
          <Link
            className={button({ size: "block", variant: "ghost" })}
            href="/"
          >
            Go home
          </Link>
        </div>
      </div>
    </main>
  );
}
