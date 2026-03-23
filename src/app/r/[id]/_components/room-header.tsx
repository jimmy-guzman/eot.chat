"use client";

import { Menu } from "@base-ui/react/menu";
import { EllipsisIcon } from "lucide-react";
import { css } from "styled-system/css";
import { button, menu } from "styled-system/recipes";

interface Props {
  name: string;
  onClear: () => void;
  onCopyLink: () => void;
  onExit: () => void;
  roomUrl: string;
}

export const RoomHeader = ({
  name,
  onClear,
  onCopyLink,
  onExit,
  roomUrl,
}: Props) => {
  const menuClasses = menu();

  return (
    <header
      className={css({
        backgroundColor: "base-200",
        borderBottom: "1px solid token(colors.base-300)",
        padding: "4 5",
      })}
    >
      <div
        className={css({
          alignItems: "center",
          display: "flex",
          gap: "3",
          justifyContent: "space-between",
        })}
      >
        <h1
          className={css({
            color: "accent",
            fontSize: "lg",
            fontWeight: "extrabold",
            letterSpacing: "display",
          })}
        >
          {name}
        </h1>
        <div
          className={css({ alignItems: "center", display: "flex", gap: "2" })}
        >
          <button
            aria-label="Copy room link to clipboard"
            className={button({ size: "sm", variant: "secondary" })}
            onClick={onCopyLink}
            type="button"
          >
            Copy Link
          </button>
          <Menu.Root>
            <Menu.Trigger
              aria-label="Room actions"
              className={menuClasses.trigger}
            >
              <EllipsisIcon size={16} />
            </Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner align="end" sideOffset={6}>
                <Menu.Popup className={menuClasses.popup}>
                  <Menu.Item className={menuClasses.item} onClick={onClear}>
                    Clear Chat
                  </Menu.Item>
                  <Menu.Separator className={menuClasses.separator} />
                  <Menu.Item
                    className={menu({ variant: "danger" }).item}
                    onClick={onExit}
                  >
                    Exit Room
                  </Menu.Item>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </div>
      </div>
      <p
        className={css({
          color: "base-content-muted",
          fontSize: "xs",
          marginTop: "1",
        })}
      >
        {roomUrl}
      </p>
    </header>
  );
};
