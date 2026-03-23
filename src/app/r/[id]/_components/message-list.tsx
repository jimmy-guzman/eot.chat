"use client";

import type { Message } from "@party/types";
import type { RefObject } from "react";

import { css, cx } from "styled-system/css";
import { motionEnter } from "styled-system/recipes";

const scrollRegionClass = css({
  flex: "1",
  overflowY: "auto",
  padding: "5",
});

const centeredStatusClass = cx(
  motionEnter({ preset: "fade" }),
  css({
    alignItems: "center",
    display: "flex",
    flexDirection: "column",
    gap: "3",
    justifyContent: "center",
    paddingY: "10",
  }),
);

const mutedTextClass = css({
  color: "base-content-muted",
  fontSize: "sm",
  textAlign: "center",
});

const threadClass = css({
  display: "flex",
  flexDirection: "column",
  gap: "4",
});

interface Props {
  bottomRef: RefObject<HTMLDivElement | null>;
  displayName: string;
  initialized: boolean;
  messages: Message[];
}

export const MessageList = ({
  bottomRef,
  displayName,
  initialized,
  messages,
}: Props) => {
  return (
    <div aria-busy={!initialized} className={scrollRegionClass}>
      {initialized ? null : (
        <div aria-live="polite" className={centeredStatusClass} role="status">
          <p className={mutedTextClass}>Connecting…</p>
        </div>
      )}
      {initialized && messages.length === 0 ? (
        <div className={centeredStatusClass}>
          <p className={mutedTextClass}>The room is waiting…</p>
        </div>
      ) : null}
      <div className={threadClass}>
        {initialized
          ? messages.map((msg) => {
              const isOwn = msg.authorDisplayName === displayName;

              return (
                <div
                  className={cx(
                    motionEnter({ preset: "raise" }),
                    css({
                      alignItems: "flex-start",
                      alignSelf: isOwn ? "flex-end" : "flex-start",
                      display: "flex",
                      flexDirection: "column",
                      gap: "1",
                    }),
                  )}
                  key={msg.id}
                >
                  <span
                    className={css({
                      color: "base-content-muted",
                      fontSize: "xs",
                      fontWeight: "bold",
                      paddingX: "1",
                    })}
                  >
                    {msg.authorDisplayName}
                  </span>
                  <div
                    className={css({
                      backgroundColor: isOwn ? "base-300" : "base-200",
                      borderRadius: "md",
                      boxShadow: "sm",
                      maxWidth: "bubble",
                      padding: "3",
                      width: "fit-content",
                    })}
                  >
                    <p
                      className={css({
                        color: "base-content",
                        fontSize: "base",
                        lineHeight: "body",
                        margin: "0",
                      })}
                    >
                      {msg.rawInput}
                    </p>
                  </div>
                </div>
              );
            })
          : null}
      </div>
      <div ref={bottomRef} />
    </div>
  );
};
