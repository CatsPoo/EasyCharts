// src/components/users/UserDialog.tsx
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Switch,
  Stack,
  Alert,
  IconButton,
  InputAdornment,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { useEffect, useMemo, useState } from "react";
import type { User } from "@easy-charts/easycharts-types";
import { Permission } from "@easy-charts/easycharts-types";
import type { SubmitPayload } from "./interfaces";


type UserDialogProps = {
  open: boolean;
  initial?: Partial<User>; // for edit; can pass { id, username, isActive, permissions }
  onClose: () => void;
  onSubmit: (payload: SubmitPayload) => Promise<void> | void; // parent calls create/update
  saving?: boolean; // wire to mutation.isPending if you want
  allowUsernameEditOnEdit?: boolean; // default false
};

const ALL_PERMS = Object.values(Permission).filter(
  (v) => typeof v === "string"
) as Permission[];

export function UserDialog({
  open,
  initial,
  onClose,
  onSubmit,
  saving = false,
  allowUsernameEditOnEdit = false,
}: UserDialogProps) {
  const isCreate : boolean = initial?.id === null || initial?.id === undefined

  const [username, setUsername] = useState(initial?.username ?? "");
  const [isActive, setIsActive] = useState<boolean>(initial?.isActive ?? true);
  const [permissions, setPermissions] = useState<Permission[]>(
    (initial?.permissions as Permission[]) ?? []
  );

  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [wantsPasswordReset, setWantsPasswordReset] = useState<boolean>(false);

  const [error, setError] = useState<string | null>(null);

  // Reset form when dialog opens/closes or initial changes
  useEffect(() => {
    if (!open) return;
    setUsername(initial?.username ?? "");
    setIsActive(initial?.isActive ?? true);
    setPermissions((initial?.permissions as Permission[]) ?? []);
    setPassword("");
    setShowPassword(false);
    setWantsPasswordReset(false);
    setError(null);
  }, [open, initial]);

  const usernameDisabled = !isCreate && !allowUsernameEditOnEdit;

  const togglePermission = (perm: Permission) => {
    setPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  const canSubmit = useMemo(() => {
    if (username.trim().length < 3) return false;
    if (isCreate && password.trim().length < 6) return false;
    if (!isCreate && wantsPasswordReset && password.trim().length < 6)
      return false;
    return true;
  }, [isCreate, username, password, wantsPasswordReset]);

  const handleSubmit = async () => {
    setError(null);
    if (!canSubmit) {
      setError(
        isCreate
          ? "Username must be at least 3 characters and password at least 6."
          : wantsPasswordReset
          ? "Username must be at least 3 characters and new password at least 6."
          : "Username must be at least 3 characters."
      );
      return;
    }

    const payload: SubmitPayload = {
      username: username.trim(),
      isActive,
      permissions,
      ...(isCreate
        ? { password: password.trim() }
        : wantsPasswordReset && password.trim()
        ? { password: password.trim() }
        : {}),
    };

    try {
      await onSubmit(payload);
      onClose();
    } catch (e: any) {
      setError(e?.message || "Save failed");
    }
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>{isCreate ? "Create User" : "Edit User"}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} mt={0.5}>
          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={saving || usernameDisabled}
            autoFocus
            fullWidth
          />

          {/* Password controls */}
          {isCreate ? (
            <TextField
              label="Password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={saving}
              fullWidth
              helperText="At least 6 characters"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword((s) => !s)}
                      edge="end"
                      aria-label="toggle password visibility"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          ) : (
            <Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={wantsPasswordReset}
                    onChange={(e) => setWantsPasswordReset(e.target.checked)}
                    disabled={saving}
                  />
                }
                label="Set / Reset password"
              />
              {wantsPasswordReset && (
                <TextField
                  label="New Password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={saving}
                  fullWidth
                  helperText="At least 6 characters"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword((s) => !s)}
                          edge="end"
                          aria-label="toggle password visibility"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              )}
            </Box>
          )}

          <FormControlLabel
            control={
              <Switch
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                disabled={saving}
              />
            }
            label={isActive ? "Active" : "Disabled"}
          />

          {/* Permissions */}
          <Box>
            <Box sx={{ fontSize: 13, opacity: 0.7, mb: 0.5 }}>
              Permissions
            </Box>
            <FormGroup
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                gap: 0.5,
              }}
            >
              {ALL_PERMS.map((perm) => (
                <FormControlLabel
                  key={perm}
                  control={
                    <Checkbox
                      checked={permissions.includes(perm)}
                      onChange={() => togglePermission(perm)}
                      disabled={saving}
                    />
                  }
                  label={perm}
                />
              ))}
            </FormGroup>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={saving || !canSubmit}
        >
          {isCreate ? "Create" : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
