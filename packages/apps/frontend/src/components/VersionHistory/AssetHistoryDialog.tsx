import {
  Box,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
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
import { useAssetVersions, useRollbackAssetVersion } from "../../hooks/assetVersionsHooks";
import { ConfirmDialog } from "../DeleteAlertDialog";
import type { AnyAsset, AssetKind, AssetVersionMeta } from "@easy-charts/easycharts-types";

interface AssetHistoryDialogProps {
  kind: AssetKind;
  asset: AnyAsset | null;
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

export function AssetHistoryDialog({ kind, asset, open, onClose, onRollbackSuccess }: AssetHistoryDialogProps) {
  const { data: versions, isLoading } = useAssetVersions(kind, asset?.id);
  const rollbackMut = useRollbackAssetVersion();
  const [pending, setPending] = useState<AssetVersionMeta | null>(null);

  const handleRollbackConfirm = () => {
    if (!pending || !asset) return;
    rollbackMut.mutate(
      { kind, assetId: asset.id, versionId: pending.id },
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

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box sx={{ flex: 1 }}>
            History — {asset?.name}
          </Box>
          <IconButton size="small" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ p: 0 }}>
          {isLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress size={32} />
            </Box>
          ) : !versions?.length ? (
            <Box sx={{ px: 2, py: 4, textAlign: "center" }}>
              <Typography color="text.secondary">No versions saved yet.</Typography>
            </Box>
          ) : (
            <List dense>
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
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Chip
                            label={`v${v.versionNumber}`}
                            size="small"
                            color={idx === 0 ? "primary" : "default"}
                            variant={idx === 0 ? "filled" : "outlined"}
                          />
                          {idx === 0 && (
                            <Chip label="current" size="small" color="success" variant="outlined" />
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
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!pending}
        title={`Rollback to v${pending?.versionNumber}?`}
        description={`This will restore "${asset?.name}" to version ${pending?.versionNumber} and create a new version entry.`}
        confirmText="Rollback"
        confirmColor="warning"
        loading={rollbackMut.isPending}
        onConfirm={handleRollbackConfirm}
        onCancel={() => setPending(null)}
      />
    </>
  );
}
