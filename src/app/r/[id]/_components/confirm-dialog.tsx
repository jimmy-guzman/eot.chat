"use client";

import { css } from "styled-system/css";
import { button, card } from "styled-system/recipes";

interface Props {
  description: string;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
}

export const ConfirmDialog = ({
  description,
  onCancel,
  onConfirm,
  title,
}: Props) => {
  return (
    <div
      aria-modal="true"
      className={css({
        alignItems: "center",
        backgroundColor: "rgba(13,14,16,0.85)",
        bottom: "0",
        display: "flex",
        justifyContent: "center",
        left: "0",
        padding: "6",
        position: "fixed",
        right: "0",
        top: "0",
        zIndex: 100,
      })}
      role="dialog"
    >
      <div
        className={card({
          variant: "default",
        })}
      >
        <div className={css({ padding: "8" })}>
          <h2
            className={css({
              color: "base-content",
              fontSize: "lg",
              fontWeight: "extrabold",
              letterSpacing: "display",
              marginBottom: "2",
            })}
          >
            {title}
          </h2>
          <p
            className={css({
              color: "base-content-muted",
              fontSize: "sm",
              lineHeight: "body",
              marginBottom: "6",
            })}
          >
            {description}
          </p>
          <div
            className={css({
              display: "flex",
              gap: "3",
              justifyContent: "flex-end",
            })}
          >
            <button
              className={button({ size: "sm", variant: "ghost" })}
              onClick={onCancel}
              type="button"
            >
              Cancel
            </button>
            <button
              className={button({ size: "sm", variant: "danger" })}
              onClick={onConfirm}
              type="button"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
