"use client";

import type { Participant } from "@party/types";

import {
  domMax,
  LayoutGroup,
  LazyMotion,
  m,
  useReducedMotion,
} from "motion/react";
import { css } from "styled-system/css";
import { badge } from "styled-system/recipes";

import { layoutListSpring } from "@/lib/layout-list-spring";

const stripClass = css({
  backgroundColor: "base-200",
  borderBottom: "1px solid token(colors.base-300)",
  display: "flex",
  gap: "2",
  listStyle: "none",
  margin: "0",
  overflowX: "auto",
  padding: "2 5",
});

interface Props {
  displayName: string;
  participants: Participant[];
}

export const ParticipantStrip = ({ displayName, participants }: Props) => {
  const reduceMotion = useReducedMotion();

  return (
    <LazyMotion features={domMax}>
      <LayoutGroup>
        <ul aria-label="Participants" className={stripClass}>
          {participants.map((p) => {
            return (
              <m.li
                className={badge({
                  variant: p.displayName === displayName ? "active" : "default",
                })}
                key={p.displayName}
                layout={!reduceMotion}
                transition={reduceMotion ? { duration: 0 } : layoutListSpring}
              >
                {p.displayName}
              </m.li>
            );
          })}
        </ul>
      </LayoutGroup>
    </LazyMotion>
  );
};
