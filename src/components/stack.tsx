import type { ReactNode } from "react";

import { css } from "styled-system/css";

interface Props {
  children?: ReactNode;
  direction?: "horizontal" | "vertical";
  gap?: number;
}

export const Stack = ({ children, direction = "vertical", gap = 4 }: Props) => {
  return (
    <div
      className={css({
        display: "flex",
      })}
      style={{
        flexDirection: direction === "horizontal" ? "row" : "column",
        gap: `${gap * 4}px`,
      }}
    >
      {children}
    </div>
  );
};
