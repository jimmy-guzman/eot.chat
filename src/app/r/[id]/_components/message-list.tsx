"use client";

import type { RefObject } from "react";

import { css } from "styled-system/css";

import type { Message } from "../../../../../party/types";

interface Props {
  bottomRef: RefObject<HTMLDivElement | null>;
  displayName: string;
  messages: Message[];
}

export const MessageList = ({ bottomRef, displayName, messages }: Props) => {
  return (
    <div
      className={css({
        flex: "1",
        overflowY: "auto",
        padding: "5",
      })}
    >
      {messages.length === 0 ? (
        <div
          className={css({
            alignItems: "center",
            display: "flex",
            flexDirection: "column",
            gap: "3",
            justifyContent: "center",
            paddingY: "10",
          })}
        >
          <p
            className={css({
              color: "base-content-muted",
              fontSize: "sm",
              textAlign: "center",
            })}
          >
            The room is waiting…
          </p>
        </div>
      ) : null}
      <div
        className={css({
          display: "flex",
          flexDirection: "column",
          gap: "4",
        })}
      >
        {messages.map((msg) => {
          const isOwn = msg.authorDisplayName === displayName;

          return (
            <div
              className={css({
                alignItems: "flex-start",
                alignSelf: isOwn ? "flex-end" : "flex-start",
                display: "flex",
                flexDirection: "column",
                gap: "1",
              })}
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
        })}
      </div>
      <div ref={bottomRef} />
    </div>
  );
};
