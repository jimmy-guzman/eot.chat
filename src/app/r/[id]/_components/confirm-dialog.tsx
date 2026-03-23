"use client";

import { AlertDialog } from "@base-ui/react/alert-dialog";
import { alertDialog, button } from "styled-system/recipes";

interface Props {
  description: string;
  onCancel: () => void;
  onConfirm: () => void;
  open: boolean;
  title: string;
}

export const ConfirmDialog = ({
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
            <AlertDialog.Close
              className={button({ size: "sm", variant: "danger" })}
              onClick={onConfirm}
            >
              Confirm
            </AlertDialog.Close>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
};
