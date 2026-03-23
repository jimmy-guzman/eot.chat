"use client";

import type { Participant } from "@party/types";

import { css } from "styled-system/css";
import { badge } from "styled-system/recipes";

interface Props {
  displayName: string;
  participants: Participant[];
}

export const ParticipantStrip = ({ displayName, participants }: Props) => {
  if (participants.length === 0) return null;

  return (
    <ul
      aria-label="Participants"
      className={css({
        backgroundColor: "base-200",
        borderBottom: "1px solid token(colors.base-300)",
        display: "flex",
        gap: "2",
        listStyle: "none",
        margin: "0",
        overflowX: "auto",
        padding: "2 5",
      })}
    >
      {participants.map((p) => {
        return (
          <li
            className={badge({
              variant: p.displayName === displayName ? "active" : "default",
            })}
            key={p.displayName}
          >
            {p.displayName}
          </li>
        );
      })}
    </ul>
  );
};
