import {
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import type { Device } from "@easy-charts/easycharts-types";

type Props = {
  device: Device | null;
  open: boolean;
  onClose: () => void;
};

export function DevicePortsViewDialog({ device, open, onClose }: Props) {
  const ports = device?.ports ?? [];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Ports — {device?.name}</DialogTitle>
      <DialogContent>
        <Table
          size="small"
          sx={{
            border: 1,
            borderColor: "divider",
            "& .MuiTableCell-root": { borderColor: "divider" },
          }}
        >
          <TableHead>
            <TableRow sx={(t) => ({ bgcolor: t.palette.action.hover })}>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>In Use</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {ports.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={3}
                  align="center"
                  sx={{ color: "text.secondary", py: 2 }}
                >
                  No ports
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
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
