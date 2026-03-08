import { useEffect, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";

interface Props {
  open: boolean;
  currentText: string;
  onClose: () => void;
  onSave: (text: string) => void;
}

export function CustomElementTextDialog({ open, currentText, onClose, onSave }: Props) {
  const [text, setText] = useState(currentText);

  useEffect(() => {
    if (open) setText(currentText);
  }, [open, currentText]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Element Text</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          multiline
          rows={4}
          fullWidth
          label="Free text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          sx={{ mt: 1 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outlined">Cancel</Button>
        <Button onClick={() => onSave(text)} variant="contained">Save</Button>
      </DialogActions>
    </Dialog>
  );
}
