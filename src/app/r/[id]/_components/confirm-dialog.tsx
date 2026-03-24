"use client";

import type { ReactNode } from "react";

import { AlertDialog } from "@base-ui/react/alert-dialog";
import { alertDialog, button } from "styled-system/recipes";

interface Props {
  closeOnConfirm?: boolean;
  confirmDisabled?: boolean;
  confirmLabel?: string;
  description: ReactNode;
  onCancel: () => void;
  onConfirm: () => Promise<void> | void;
  open: boolean;
  title: string;
}

export const ConfirmDialog = ({
  closeOnConfirm = true,
  confirmDisabled = false,
  confirmLabel = "Confirm",
  description,
  onCancel,
  onConfirm,
  open,
  title,
}: Props) => {
  const classes = alertDialog();

  return (
    <AlertDialog.Root onOpenChange={onCancel} open={open}>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className={classes.backdrop} />
        <AlertDialog.Popup className={classes.popup}>
          <AlertDialog.Title className={classes.title}>
            {title}
          </AlertDialog.Title>
          <AlertDialog.Description className={classes.description}>
            {description}
          </AlertDialog.Description>
          <div className={classes.actions}>
            <AlertDialog.Close
              className={button({ size: "sm", variant: "ghost" })}
              onClick={onCancel}
            >
              Cancel
            </AlertDialog.Close>
            {closeOnConfirm ? (
              <AlertDialog.Close
                className={button({ size: "sm", variant: "danger" })}
                onClick={() => {
                  void onConfirm();
                }}
              >
                {confirmLabel}
              </AlertDialog.Close>
            ) : (
              <button
                className={button({ size: "sm", variant: "danger" })}
                disabled={confirmDisabled}
                onClick={() => {
                  void onConfirm();
                }}
                type="button"
              >
                {confirmLabel}
              </button>
            )}
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
};
