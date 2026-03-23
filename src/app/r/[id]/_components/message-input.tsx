"use client";

import type { KeyboardEvent } from "react";

import { css, cx } from "styled-system/css";
import { button, input } from "styled-system/recipes";

interface Props {
  disabled?: boolean;
  onSend: () => void;
  onTyping: () => void;
  setValue: (value: string) => void;
  value: string;
}

export const MessageInput = ({
  disabled = false,
  onSend,
  onTyping,
  setValue,
  value,
}: Props) => {
  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSend();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <form
      className={css({
        backgroundColor: "base-200",
        borderTop: "1px solid token(colors.base-300)",
        display: "flex",
        gap: "3",
        padding: "4 5",
      })}
      onSubmit={handleSubmit}
    >
      <textarea
        aria-label="Message"
        autoComplete="off"
        className={cx(
          input(),
          css({
            fieldSizing: "content",
            flex: "1",
            maxHeight: "8rem",
            resize: "none",
            width: "auto",
          }),
        )}
        disabled={disabled}
        onChange={(e) => {
          setValue(e.target.value);

          if (e.target.value.trim()) {
            onTyping();
          }
        }}
        onKeyDown={handleKeyDown}
        placeholder="Send anything…"
        value={value}
      />
      <button
        aria-label="Send message"
        className={button({ variant: "primary" })}
        disabled={disabled || !value.trim()}
        type="submit"
      >
        Send
      </button>
    </form>
  );
};
