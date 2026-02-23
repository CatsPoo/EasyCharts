import { useEffect, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import type { PortType } from "@easy-charts/easycharts-types";
import { PortTypeValues } from "@easy-charts/easycharts-types";

export type PortFormValues = {
  name: string;
  type: PortType;
};

type Props = {
  open: boolean;
  initial?: Partial<PortFormValues>;
  title?: string;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (values: PortFormValues) => void;
};

export function PortFormDialog({
  open,
  initial,
  title = "Create Port",
  loading = false,
  onClose,
  onSubmit,
}: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [type, setType] = useState<string>(initial?.type ?? PortTypeValues[0]);

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? "");
      setType(initial?.type ?? PortTypeValues[0]);
    }
  }, [open, initial]);

  const handleSubmit = () => {
    if (!name.trim() || !type) return;
    onSubmit({ name: name.trim(), type: type as PortType });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent dividers>
        <div className="flex flex-col gap-3 pt-1">
          <TextField
            label="Name"
            size="small"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            fullWidth
          />
          <FormControl size="small" fullWidth>
            <InputLabel id="port-type-label">Type</InputLabel>
            <Select
              labelId="port-type-label"
              label="Type"
              value={type}
              onChange={(e) => setType(String(e.target.value))}
            >
              {PortTypeValues.map((t) => (
                <MenuItem key={t} value={t}>
                  {t.toUpperCase()}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!name.trim() || !type || loading}
        >
          {loading ? "Saving…" : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
