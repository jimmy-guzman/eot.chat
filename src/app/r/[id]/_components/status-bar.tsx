import { css } from "styled-system/css";

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

interface Props {
  notification: StatusNotification;
}

export const StatusBar = ({ notification }: Props) => {
  if (!notification) return null;

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
      {formatNotification(notification)}
    </p>
  );
};
