import { Box, Chip } from "@mui/material";

export type Perms = { canEdit: boolean; canDelete: boolean; canShare: boolean };

export function PrivilegeChips({
  canEdit, canDelete, canShare, onChange, disabled, ceiling, onAdd, onRemove,
}: Perms & {
  onChange: (k: keyof Perms, v: boolean) => void;
  disabled?: boolean;
  /** Caller's own privileges — chips they don't hold are always disabled */
  ceiling?: Perms;
  /** When provided, shows "Read" chip in outlined state — clicking adds the user */
  onAdd?: () => void;
  /** When provided, shows "Read" chip in filled/active state — clicking removes the user */
  onRemove?: () => void;
}) {
  return (
    <Box sx={{ display: "flex", gap: 0.5 }}>
      {onAdd && (
        <Chip
          size="small" label="Read"
          variant="outlined"
          color="default"
          onClick={onAdd}
          disabled={disabled}
          sx={{ fontSize: 11 }}
        />
      )}
      {onRemove && (
        <Chip
          size="small" label="Read"
          variant="filled"
          color="primary"
          onClick={onRemove}
          disabled={disabled}
          sx={{ fontSize: 11 }}
        />
      )}
      <Chip
        size="small" label="Edit"
        variant={canEdit ? "filled" : "outlined"}
        color={canEdit ? "primary" : "default"}
        onClick={() => onChange("canEdit", !canEdit)}
        disabled={disabled || ceiling?.canEdit === false}
        sx={{ fontSize: 11 }}
      />
      <Chip
        size="small" label="Delete"
        variant={canDelete ? "filled" : "outlined"}
        color={canDelete ? "error" : "default"}
        onClick={() => onChange("canDelete", !canDelete)}
        disabled={disabled || ceiling?.canDelete === false}
        sx={{ fontSize: 11 }}
      />
      <Chip
        size="small" label="Share"
        variant={canShare ? "filled" : "outlined"}
        color={canShare ? "success" : "default"}
        onClick={() => onChange("canShare", !canShare)}
        disabled={disabled || ceiling?.canShare === false}
        sx={{ fontSize: 11 }}
      />
    </Box>
  );
}
