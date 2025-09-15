import type { ReactNode } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  type ButtonProps,
  type DialogProps,
} from "@mui/material";

export type ConfirmDialogProps = {
  open: boolean;
  title?: string;
  description?: string;        
  confirmText?: string;
  cancelText?: string;
  confirmColor?: ButtonProps["color"];
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  keepMounted?: DialogProps["keepMounted"];
};

export function ConfirmDialog({
  open,
  title = "Are you sure?",
  description = "",
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmColor = "primary",
  loading = false,
  onConfirm,
  onCancel,
  keepMounted = true,
}: ConfirmDialogProps) {
  const handleClose: DialogProps["onClose"] = (_, reason) => {
    // Don’t allow closing while loading
    if (loading) return;
    // Optional: block backdrop/Escape close to force explicit choice
    if (reason === "backdropClick" || reason === "escapeKeyDown") return;
    onCancel();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      keepMounted={keepMounted}
    >
      {title && <DialogTitle>{title}</DialogTitle>}
      <DialogContent dividers>
        {description ? <Typography>{description}</Typography> : null}
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} variant="outlined" disabled={loading}>
          {cancelText}
        </Button>
        <Button
          onClick={onConfirm}
          color={confirmColor}
          variant="contained"
          disabled={loading}
        >
          {loading ? `${confirmText}…` : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
