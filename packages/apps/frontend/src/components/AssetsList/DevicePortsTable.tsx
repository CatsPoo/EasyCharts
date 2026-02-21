import { useState } from "react";
import {
  Box,
  Button,
  Chip,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import type { Port, PortUpdate } from "@easy-charts/easycharts-types";
import { PortTypeValues } from "@easy-charts/easycharts-types";
import { createPort, updatePort, deletePort } from "../../hooks/portsHooks";

const portFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(PortTypeValues),
  inUse: z.boolean().default(false),
});

type PortFormValues = z.infer<typeof portFormSchema>;

type Props = {
  deviceId: string;
  initialPorts: Port[];
};

export function DevicePortsTable({ deviceId, initialPorts }: Props) {
  const [ports, setPorts] = useState<Port[]>(initialPorts);
  const [formOpen, setFormOpen] = useState(false);
  const [editingPort, setEditingPort] = useState<Port | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PortFormValues>({
    resolver: zodResolver(portFormSchema),
    defaultValues: { name: "", type: "rj45", inUse: false },
  });

  const openCreate = () => {
    setEditingPort(null);
    reset({ name: "", type: "rj45", inUse: false });
    setFormOpen(true);
  };

  const openEdit = (port: Port) => {
    setEditingPort(port);
    reset({ name: port.name, type: port.type, inUse: port.inUse });
    setFormOpen(true);
  };

  const onDelete = async (port: Port) => {
    setDeleting(port.id);
    try {
      await deletePort(port.id);
      setPorts((prev) => prev.filter((p) => p.id !== port.id));
    } finally {
      setDeleting(null);
    }
  };

  const onSubmit = async (values: PortFormValues) => {
    if (editingPort) {
      const updated = await updatePort(editingPort.id, values as PortUpdate);
      setPorts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    } else {
      const created = await createPort({
        ...values,
        deviceId,
        id: crypto.randomUUID(),
      });
      setPorts((prev) => [...prev, created]);
    }
    setFormOpen(false);
  };

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 1,
        }}
      >
        <Typography variant="subtitle2">Ports</Typography>
        <Button size="small" startIcon={<AddIcon />} onClick={openCreate}>
          Add Port
        </Button>
      </Box>

      <Table
        size="small"
        sx={{ border: 1, borderColor: "divider", borderRadius: 1 }}
      >
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>In Use</TableCell>
            <TableCell align="right" />
          </TableRow>
        </TableHead>
        <TableBody>
          {ports.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={4}
                align="center"
                sx={{ color: "text.secondary", py: 2 }}
              >
                No ports added
              </TableCell>
            </TableRow>
          )}
          {ports.map((port) => (
            <TableRow key={port.id}>
              <TableCell>{port.name}</TableCell>
              <TableCell>
                <Chip label={port.type.toUpperCase()} size="small" />
              </TableCell>
              <TableCell>{port.inUse ? "Yes" : "No"}</TableCell>
              <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                <IconButton size="small" onClick={() => openEdit(port)}>
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  color="error"
                  disabled={deleting === port.id}
                  onClick={() => onDelete(port)}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>{editingPort ? "Edit Port" : "Add Port"}</DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="Name"
                {...register("name")}
                error={!!errors.name}
                helperText={errors.name?.message}
                fullWidth
              />
              <Controller
                control={control}
                name="type"
                render={({ field }) => (
                  <TextField
                    select
                    label="Type"
                    {...field}
                    error={!!errors.type}
                    helperText={errors.type?.message as string}
                    fullWidth
                  >
                    {PortTypeValues.map((t) => (
                      <MenuItem key={t} value={t}>
                        {t.toUpperCase()}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
              <Controller
                control={control}
                name="inUse"
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Checkbox {...field} checked={field.value ?? false} />
                    }
                    label="In Use"
                  />
                )}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setFormOpen(false)} variant="outlined">
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={isSubmitting}>
              Save
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
