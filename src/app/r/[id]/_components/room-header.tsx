"use client";

import { css } from "styled-system/css";
import { button } from "styled-system/recipes";

interface Props {
  id: string;
  name: string;
  onClear: () => void;
  onCopyLink: () => void;
  onExit: () => void;
}

export const RoomHeader = ({
  id,
  name,
  onClear,
  onCopyLink,
  onExit,
}: Props) => {
  return <header
      className={css({
        backgroundColor: "base-200",
        borderBottom: "1px solid token(colors.base-300)",
        padding: "4 5",
      })}
    >
      <div
        className={css({
          alignItems: "center",
          display: "flex",
          gap: "3",
          justifyContent: "space-between",
        })}
      >
        <h1
          className={css({
            color: "accent",
            fontSize: "lg",
            fontWeight: "extrabold",
            letterSpacing: "display",
          })}
        >
          {name}
        </h1>
        <div className={css({ display: "flex", gap: "2" })}>
          <button
            aria-label="Copy room link to clipboard"
            className={button({ size: "sm", variant: "secondary" })}
            onClick={onCopyLink}
            type="button"
          >
            Copy Link
          </button>
          <button
            aria-label="Clear all chat messages"
            className={button({ size: "sm", variant: "ghost" })}
            onClick={onClear}
            type="button"
          >
            Clear Chat
          </button>
          <button
            aria-label="Exit this room"
            className={button({ size: "sm", variant: "danger" })}
            onClick={onExit}
            type="button"
          >
            Exit Room
          </button>
        </div>
      </div>
      <p
        className={css({
          color: "base-content-muted",
          fontSize: "xs",
          marginTop: "1",
        })}
      >
        {`https://eot.chat/r/${id}`}
      </p>
    </header>;
};
