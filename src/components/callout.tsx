import { css } from "styled-system/css";

interface Props {
  content: string;
  title?: string;
  type: "info" | "tip" | "warning";
}

const BG_COLOR: Record<Props["type"], string> = {
  info: "powder-blue",
  tip: "mint",
  warning: "yellow",
};

const ICON: Record<Props["type"], string> = {
  info: "ℹ",
  tip: "✦",
  warning: "⚠",
};

export const Callout = ({ content, title, type }: Props) => {
  return (
    <div
      className={css({
        borderRadius: "md",
        padding: "4",
      })}
      style={{ backgroundColor: `var(--colors-${BG_COLOR[type]})` }}
    >
      <div
        className={css({
          alignItems: "center",
          display: "flex",
          gap: "2",
          marginBottom: title ? "2" : "0",
        })}
      >
        <span
          aria-hidden="true"
          className={css({
            fontSize: "base",
          })}
        >
          {ICON[type]}
        </span>
        {title ? (
          <p
            className={css({
              fontSize: "sm",
              fontWeight: "bold",
            })}
          >
            {title}
          </p>
        ) : null}
      </div>
      <p
        className={css({
          fontSize: "sm",
          lineHeight: "body",
        })}
      >
        {content}
      </p>
    </div>
  );
};
