import { useState } from "react";
import {
  Box,
  Button,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import type { Port } from "@easy-charts/easycharts-types";
import { createPort, updatePort, deletePort } from "../../hooks/portsHooks";
import { PortFormDialog, type PortFormValues } from "../PortFormDialog";

type Props = {
  deviceId: string;
  initialPorts: Port[];
};

export function DevicePortsTable({ deviceId, initialPorts }: Props) {
  const [ports, setPorts] = useState<Port[]>(initialPorts);
  const [formOpen, setFormOpen] = useState(false);
  const [editingPort, setEditingPort] = useState<Port | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const openCreate = () => {
    setEditingPort(null);
    setFormOpen(true);
  };

  const openEdit = (port: Port) => {
    setEditingPort(port);
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
    setSubmitting(true);
    try {
      if (editingPort) {
        const updated = await updatePort(editingPort.id, { ...values, inUse: editingPort.inUse });
        setPorts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      } else {
        const created = await createPort({
          ...values,
          inUse: false,
          deviceId,
          id: crypto.randomUUID(),
        });
        setPorts((prev) => [...prev, created]);
      }
      setFormOpen(false);
    } finally {
      setSubmitting(false);
    }
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

      <PortFormDialog
        open={formOpen}
        title={editingPort ? "Edit Port" : "Add Port"}
        initial={editingPort ?? undefined}
        loading={submitting}
        onClose={() => setFormOpen(false)}
        onSubmit={onSubmit}
      />
    </Box>
  );
}
