import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from "@mui/material";
import { useEffect, useState } from "react";

interface EditBondDialogProps {
  open: boolean;
  bondName: string;
  onClose: () => void;
  onSubmit: (name: string) => void;
}

export function EditBondDialog({ open, bondName, onClose, onSubmit }: EditBondDialogProps) {
  const [name, setName] = useState(bondName);

  useEffect(() => {
    if (open) setName(bondName);
  }, [open, bondName]);

  if (!open) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Bond</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Bond Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outlined">Cancel</Button>
        <Button variant="contained" onClick={() => onSubmit(name.trim())}>Save</Button>
      </DialogActions>
    </Dialog>
  );
}
