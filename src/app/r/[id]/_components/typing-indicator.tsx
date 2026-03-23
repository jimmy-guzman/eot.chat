"use client";

import { css } from "styled-system/css";

interface Props {
  names: string[];
}

const formatTyping = (names: string[]): string => {
  if (names.length === 1) {
    return `${names[0]} is typing…`;
  }

  return `${names.slice(0, -1).join(", ")} and ${names.at(-1)} are typing…`;
};

export const TypingIndicator = ({ names }: Props) => {
  if (names.length === 0) return null;

  return (
    <p
      aria-live="polite"
      className={css({
        backgroundColor: "base-200",
        borderBottom: "1px solid token(colors.base-300)",
        color: "base-content-muted",
        fontSize: "xs",
        paddingX: "5",
        paddingY: "1",
      })}
    >
      {formatTyping(names)}
    </p>
  );
};
