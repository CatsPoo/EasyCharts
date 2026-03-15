import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { useListAssets, useCreateAsset } from "../hooks/assetsHooks";

export type PortFormValues = {
  name: string;
  type: string;
};

type Props = {
  open: boolean;
  initial?: Partial<PortFormValues>;
  title?: string;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (values: PortFormValues) => void;
};

function QuickCreatePortTypeDialog({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: (name: string) => void;
}) {
  const [name, setName] = useState("");
  const { mutateAsync, isPending } = useCreateAsset("portTypes");

  useEffect(() => {
    if (open) setName("");
  }, [open]);

  const handleCreate = async () => {
    if (!name.trim()) return;
    try {
      const result = await mutateAsync({ name: name.trim() } as any);
      onSuccess((result as any).name);
      onClose();
    } catch {
      // keep open on error
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Create Port Type</DialogTitle>
      <DialogContent dividers>
        <TextField
          label="Name"
          size="small"
          fullWidth
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleCreate} disabled={!name.trim() || isPending}>
          {isPending ? "Creating…" : "Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function PortFormDialog({
  open,
  initial,
  title = "Create Port",
  loading = false,
  onClose,
  onSubmit,
}: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [type, setType] = useState<string>(initial?.type ?? "");
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);

  const { data: portTypesData, isLoading: loadingTypes } = useListAssets("portTypes");
  const portTypes = useMemo(() => portTypesData?.rows ?? [], [portTypesData?.rows]);

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? "");
      setType(initial?.type ?? "");
    }
  }, [open, initial]);

  // Auto-select first port type when list loads and nothing selected
  useEffect(() => {
    if (!type && portTypes.length > 0) {
      setType((portTypes[0] as any).name);
    }
  }, [portTypes, type]);

  const handleSubmit = () => {
    if (!name.trim() || !type) return;
    onSubmit({ name: name.trim(), type });
  };

  return (
    <>
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
                disabled={loadingTypes}
              >
                {portTypes.map((pt: any) => (
                  <MenuItem key={pt.id} value={pt.name}>
                    {pt.name.toUpperCase()}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>
                <Box
                  component="span"
                  sx={{ display: "flex", alignItems: "center", gap: 0.5, cursor: "pointer", color: "primary.main" }}
                  onClick={() => setQuickCreateOpen(true)}
                >
                  <AddIcon sx={{ fontSize: 14 }} /> Create new port type
                </Box>
              </FormHelperText>
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

      <QuickCreatePortTypeDialog
        open={quickCreateOpen}
        onClose={() => setQuickCreateOpen(false)}
        onSuccess={(typeName) => setType(typeName)}
      />
    </>
  );
}
