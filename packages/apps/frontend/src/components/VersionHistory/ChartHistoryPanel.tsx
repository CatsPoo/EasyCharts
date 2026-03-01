import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Tooltip,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import RestoreIcon from "@mui/icons-material/Restore";
import { useState } from "react";
import { useChartVersions, useRollbackChartVersion } from "../../hooks/chartVersionsHooks";
import { ConfirmDialog } from "../DeleteAlertDialog";
import type { ChartVersionMeta } from "@easy-charts/easycharts-types";

interface ChartHistoryPanelProps {
  chartId: string;
  open: boolean;
  onClose: () => void;
  onRollbackSuccess: () => void;
}

function formatRelativeTime(date: Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function ChartHistoryPanel({ chartId, open, onClose, onRollbackSuccess }: ChartHistoryPanelProps) {
  const { data: versions, isLoading } = useChartVersions(chartId);
  const rollbackMut = useRollbackChartVersion();
  const [pending, setPending] = useState<ChartVersionMeta | null>(null);

  const handleRollbackConfirm = () => {
    if (!pending) return;
    rollbackMut.mutate(
      { chartId, versionId: pending.id },
      {
        onSuccess: () => {
          setPending(null);
          onRollbackSuccess();
          onClose();
        },
        onSettled: () => {
          if (rollbackMut.isError) setPending(null);
        },
      },
    );
  };

  const latestVersion = versions?.[0]?.versionNumber;

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        PaperProps={{ sx: { width: 360, display: "flex", flexDirection: "column" } }}
      >
        <Box sx={{ display: "flex", alignItems: "center", px: 2, py: 1.5, gap: 1 }}>
          <Typography variant="h6" sx={{ flex: 1 }}>
            Chart History
          </Typography>
          <IconButton size="small" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
        <Divider />

        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={32} />
          </Box>
        ) : !versions?.length ? (
          <Box sx={{ px: 2, py: 4, textAlign: "center" }}>
            <Typography color="text.secondary">No versions saved yet.</Typography>
          </Box>
        ) : (
          <List dense sx={{ flex: 1, overflow: "auto" }}>
            {versions.map((v, idx) => (
              <Box key={v.id}>
                <ListItem
                  sx={{ px: 2, py: 1, alignItems: "flex-start" }}
                  secondaryAction={
                    idx !== 0 && (
                      <Tooltip title={`Rollback to v${v.versionNumber}`}>
                        <IconButton
                          edge="end"
                          size="small"
                          onClick={() => setPending(v)}
                          disabled={rollbackMut.isPending}
                        >
                          <RestoreIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )
                  }
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                        <Chip
                          label={`v${v.versionNumber}`}
                          size="small"
                          color={idx === 0 ? "primary" : "default"}
                          variant={idx === 0 ? "filled" : "outlined"}
                        />
                        {idx === 0 && (
                          <Chip label="current" size="small" color="success" variant="outlined" />
                        )}
                        {v.label && (
                          <Typography variant="body2" sx={{ fontStyle: "italic" }}>
                            {v.label}
                          </Typography>
                        )}
                      </Box>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary">
                        {formatRelativeTime(v.savedAt)} · {v.savedByUsername ?? "unknown"}
                      </Typography>
                    }
                  />
                </ListItem>
                <Divider component="li" />
              </Box>
            ))}
          </List>
        )}
      </Drawer>

      <ConfirmDialog
        open={!!pending}
        title={`Rollback to v${pending?.versionNumber}?`}
        description={
          pending?.label
            ? `This will restore the chart to "${pending.label}" and create a new version entry.`
            : `This will restore the chart to version ${pending?.versionNumber} and create a new version entry.`
        }
        confirmText="Rollback"
        confirmColor="warning"
        loading={rollbackMut.isPending}
        onConfirm={handleRollbackConfirm}
        onCancel={() => setPending(null)}
      />
    </>
  );
}
