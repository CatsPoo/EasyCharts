// AssetPage.tsx
import {
  Alert,
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
  Tabs,
  Tab,
  Toolbar,
  Button,
  IconButton,
  TextField,
  Tooltip,
  Typography,
  alpha,
} from "@mui/material";
import HistoryIcon from "@mui/icons-material/History";
import {
  DataGrid,
  type GridPaginationModel,
  type GridSortModel,
} from "@mui/x-data-grid";
import { useCallback, useMemo, useState } from "react";
import { columns } from "./AsetColumn";
import {
  useListAssets,
  useCreateAsset,
  useUpdateAsset,
  useDeleteAsset,
  type AssetInUseError,
} from "../../hooks/assetsHooks";
import {
  type AssetKind,
  type AnyAsset,
  Permission,
} from "@easy-charts/easycharts-types";
import { AssetForm } from "./AssetsForm";
import { DevicePortsViewDialog } from "./DevicePortsViewDialog";
import { ConfirmDialog } from "../DeleteAlertDialog";
import { RequirePermissions } from "../../auth/RequirePermissions";
import { AssetHistoryDialog } from "../VersionHistory/AssetHistoryDialog";
import type { Device } from "@easy-charts/easycharts-types";
import { useQueryClient } from "@tanstack/react-query";

export default function AssetTab() {
  const qc = useQueryClient();
  const [kind, setKind] = useState<AssetKind>("devices");
  const [pagination, setPagination] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 25,
  });
  const [sortModel, setSortModel] = useState<GridSortModel>([]);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<AnyAsset | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<AnyAsset | null>(null);
  const [inUseError, setInUseError] = useState<(AssetInUseError & { assetName: string }) | null>(null);
  const [viewingPorts, setViewingPorts] = useState<Device | null>(null);
  const [historyAsset, setHistoryAsset] = useState<AnyAsset | null>(null);

  const sort = sortModel[0];
  const sortBy = sort?.field;
  const sortDir: "asc" | "desc" | undefined =
    sort?.sort === "asc" || sort?.sort === "desc" ? sort.sort : undefined;

  const { data, isLoading } = useListAssets(kind, {
    page: pagination.page,
    pageSize: pagination.pageSize,
    search,
    sortBy,
    sortDir,
  });

  const createMut = useCreateAsset(kind);
  const updateMut = useUpdateAsset(kind);
  const deleteMut = useDeleteAsset(kind);

  const singular = (k: AssetKind) => (k.endsWith("s") ? k.slice(0, -1) : k);

  const onDeleteDialogConfirm = useCallback(() => {
    if (!pendingDelete) return;
    const assetName = pendingDelete.name;
    deleteMut.mutate(pendingDelete.id, {
      onSuccess: () => {
        setConfirmOpen(false);
        setPendingDelete(null);
      },
      onError: (err: any) => {
        setConfirmOpen(false);
        setPendingDelete(null);
        if (err.usedIn) {
          setInUseError({ message: err.message, usedIn: err.usedIn, assetName });
        }
      },
    });
  }, [deleteMut, pendingDelete]);

  const onDeleteDialogCancel = useCallback(() => {
    if (deleteMut.isPending) return;
    setConfirmOpen(false);
    setPendingDelete(null);
  }, [deleteMut.isPending]);

  const onRowDeleteClick = useCallback((params: any) => {
    setPendingDelete(params.row);
    setConfirmOpen(true);
  }, []);

  const cols = useMemo(
    () => [
      ...columns[kind],
      {
        field: "__actions",
        headerName: "",
        width: kind === "devices" ? 270 : kind === "cableTypes" ? 240 : 210,
        sortable: false,
        renderCell: (params: any) => (
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            {kind === "devices" && (
              <Button
                size="small"
                variant="outlined"
                onClick={() => setViewingPorts(params.row as Device)}
              >
                Ports
              </Button>
            )}
            <Tooltip title="Version history">
              <IconButton size="small" onClick={() => setHistoryAsset(params.row)}>
                <HistoryIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <RequirePermissions required={[Permission.ASSET_EDIT]}>
              <Button size="small" onClick={() => setEditing(params.row)}>
                Edit
              </Button>
            </RequirePermissions>
            <RequirePermissions required={[Permission.ASSET_DELETE]}>
              <Button
                size="small"
                color="error"
                onClick={() => onRowDeleteClick(params)}
              >
                Delete
              </Button>
            </RequirePermissions>
          </Box>
        ),
      },
    ],
    [kind, onRowDeleteClick]
  );

  return (
    <Box
      sx={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 1,
      }}
    >
      <Tabs
        value={kind}
        onChange={(_, v) => setKind(v)}
        sx={(t) => ({
          bgcolor: t.palette.background.paper,
          borderBottom: 1,
          borderColor: "divider",
        })}
      >
        <Tab label="Devices" value="devices" />
        <Tab label="Device Types" value="types"/>
        <Tab label="Vendors" value="vendors" />
        <Tab label="Models" value="models" />
        <Tab label="Overlay Elements" value="overlayElements" />
        <Tab label="Port Types" value="portTypes" />
        <Tab label="Cable Types" value="cableTypes" />
      </Tabs>

      <Toolbar sx={{ gap: 1 }}>
        <TextField
          size="small"
          placeholder={`Search ${kind}...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Box sx={{ flex: 1 }} />
        <RequirePermissions required={[Permission.ASSET_CREATE]}>
          <Button variant="contained" onClick={() => setCreateOpen(true)}>
            New {kind.slice(0, -1)}
          </Button>
        </RequirePermissions>
      </Toolbar>

      <Box sx={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
        <DataGrid
          style={{ height: "100%" }}
          loading={isLoading}
          rows={data?.rows ?? []}
          columns={cols as any}
          getRowId={(r) => (r as any).id}
          paginationMode="server"
          sortingMode="server"
          rowCount={data?.total ?? 0}
          paginationModel={pagination}
          onPaginationModelChange={(m) => setPagination(m)}
          sortModel={sortModel}
          onSortModelChange={(m) => setSortModel(m)}
          pageSizeOptions={[10, 25, 50, 100]}
          disableRowSelectionOnClick
          autoHeight={false}
          sx={(t) => ({
            // Give the grid its own surface and outline
            bgcolor: "background.paper",
            color: "text.primary",
            border: 1,
            borderColor: "divider",

            // Ensure header + row separators are visible in both modes
            "--DataGrid-headerBorderColor": t.palette.divider,
            "--DataGrid-rowBorderColor": t.palette.divider,

            // Extra safety for versions without the CSS vars above:
            "& .MuiDataGrid-columnHeaders": {
              borderBottom: `1px solid ${t.palette.divider}`,
              bgcolor: t.palette.background.paper,
            },
            "& .MuiDataGrid-cell": {
              borderColor: t.palette.divider,
            },
            "& .MuiDataGrid-row": {
              borderBottom: `1px solid ${t.palette.divider}`,
            },

            // Better hovers/selection with theme
            "& .MuiDataGrid-row:hover": {
              backgroundColor: t.palette.action.hover,
            },
            "& .MuiDataGrid-row.Mui-selected": {
              backgroundColor: alpha(
                t.palette.primary.main,
                t.palette.action.selectedOpacity
              ),
              "&:hover": {
                backgroundColor: alpha(
                  t.palette.primary.main,
                  t.palette.action.selectedOpacity +
                    t.palette.action.hoverOpacity
                ),
              },
            },
          })}
        />
      </Box>

      <AssetForm
        kind={kind}
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={(values) => {
          if (kind === "devices") {
            const { vendorId, ...payload } = values;
            createMut.mutate(payload, {
              onSuccess: () => {
                setCreateOpen(false);
              },
            });
          } else {
            createMut.mutate(values);
            setCreateOpen(false);
          }
        }}
      />

      {editing && (
        <AssetForm
          kind={kind}
          open
          initial={editing as any}
          onClose={() => setEditing(null)}
          onSubmit={(values) => {
            if (kind === "devices") {
              const { vendorId, ...payload } = values;
              updateMut.mutate({ ...(editing as any), ...payload });
            } else {
              updateMut.mutate({ ...(editing as any), ...values });
            }
            setEditing(null);
          }}
        />
      )}

      <DevicePortsViewDialog
        device={viewingPorts}
        open={viewingPorts !== null}
        onClose={() => setViewingPorts(null)}
      />

      <ConfirmDialog
        open={confirmOpen}
        title={`Delete ${singular(kind)}?`}
        description={
          `Are you sure you want to delete "` +
          pendingDelete?.name +
          `"? This action cannot be undone.`
        }
        confirmText="Delete"
        confirmColor="error"
        loading={deleteMut.isPending}
        onCancel={onDeleteDialogCancel}
        onConfirm={onDeleteDialogConfirm}
      />

      <AssetHistoryDialog
        kind={kind}
        asset={historyAsset}
        open={!!historyAsset}
        onClose={() => setHistoryAsset(null)}
        onRollbackSuccess={() => qc.invalidateQueries({ queryKey: ["assets", kind] })}
      />

      <Dialog open={!!inUseError} onClose={() => setInUseError(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Cannot delete "{inUseError?.assetName}"</DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            {inUseError?.message}
          </Alert>
          <Typography variant="body2" sx={{ mb: 1 }}>
            This item is used in the following locations:
          </Typography>
          <List dense disablePadding>
            {inUseError?.usedIn.map((item) => (
              <ListItem key={item.id} sx={{ py: 0.25 }}>
                <ListItemText
                  primary={item.name}
                  secondary={item.kind}
                  primaryTypographyProps={{ variant: "body2" }}
                  secondaryTypographyProps={{ variant: "caption" }}
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
