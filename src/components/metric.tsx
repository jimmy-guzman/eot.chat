import { css } from "styled-system/css";

interface Props {
  detail?: string;
  label: string;
  trend?: "down" | "neutral" | "up";
  value: string;
}

const TREND_LABEL: Record<NonNullable<Props["trend"]>, string> = {
  down: "↓",
  neutral: "→",
  up: "↑",
};

const TREND_COLOR: Record<NonNullable<Props["trend"]>, string> = {
  down: "red",
  neutral: "ink",
  up: "cobalt",
};

export const Metric = ({ detail, label, trend, value }: Props) => {
  return (
    <div
      className={css({
        borderRadius: "md",
        padding: "4",
      })}
    >
      <p
        className={css({
          color: "ink",
          fontSize: "xs",
          fontWeight: "bold",
          letterSpacing: "display",
          marginBottom: "1",
          opacity: 0.6,
          textTransform: "uppercase",
        })}
      >
        {label}
      </p>
      <div
        className={css({
          alignItems: "baseline",
          display: "flex",
          gap: "2",
        })}
      >
        <span
          className={css({
            color: "ink",
            fontSize: "2xl",
            fontWeight: "extrabold",
            lineHeight: "tight",
          })}
        >
          {value}
        </span>
        {trend ? (
          <span
            className={css({
              color: TREND_COLOR[trend],
              fontSize: "lg",
              fontWeight: "bold",
            })}
          >
            {TREND_LABEL[trend]}
          </span>
        ) : null}
      </div>
      {detail ? (
        <p
          className={css({
            color: "ink",
            fontSize: "xs",
            lineHeight: "body",
            marginTop: "1",
            opacity: 0.6,
          })}
        >
          {detail}
        </p>
      ) : null}
    </div>
  );
};
