import { css, cx } from "styled-system/css";

import type { StatusNotification } from "./room-machine";

const formatTyping = (names: string[]): string => {
  if (names.length === 1) {
    return `${names[0]} is typing…`;
  }

  return `${names.slice(0, -1).join(", ")} and ${names.at(-1)} are typing…`;
};

const formatNotification = (notification: StatusNotification): string => {
  if (!notification) return "";

  switch (notification.type) {
    case "cleared": {
      return `${notification.displayName} cleared the chat`;
    }
    case "entered": {
      return `${notification.displayName} has entered`;
    }
    case "exited": {
      return `${notification.displayName} has exited`;
    }
    case "typing": {
      return formatTyping(notification.names);
    }
    default: {
      return "";
    }
  }
};

const shellStyles = css({
  fontSize: "xs",
  lineHeight: "tight",
  minHeight: "calc(2 * token(spacing.1) + 1lh)",
  overflow: "hidden",
  paddingX: "5",
  paddingY: "1",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});

const activeStyles = css({
  backgroundColor: "base-200",
  borderBottom: "1px solid token(colors.base-300)",
  color: "base-content-muted",
});

interface Props {
  notification: StatusNotification;
}

export const StatusBar = ({ notification }: Props) => {
  const text = notification ? formatNotification(notification) : "";
  const isActive = text.length > 0;

  return (
    <p
      aria-live={isActive ? "polite" : undefined}
      className={cx(shellStyles, isActive && activeStyles)}
    >
      {text}
    </p>
  );
};
