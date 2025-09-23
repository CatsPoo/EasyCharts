// AssetPage.tsx
import {
  Box,
  Tabs,
  Tab,
  Toolbar,
  Button,
  TextField,
  alpha,
} from "@mui/material";
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
} from "../../hooks/assetsHooks";
import { type AssetKind, type AnyAsset, Permission } from "@easy-charts/easycharts-types";
import { AssetForm } from "./AssetsForm";
import { ConfirmDialog } from "../DeleteAlertDialog";
import { RequirePermissions } from "../../auth/RequirePermissions";

export default function AssetTab() {
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
    deleteMut.mutate(pendingDelete.id, {
      onSettled: () => {
        setConfirmOpen(false);
        setPendingDelete(null);
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
        width: 160,
        sortable: false,
        renderCell: (params: any) => (
          <Box sx={{ display: "flex", gap: 1 }}>
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
    [kind]
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
        <Tab label="Vendors" value="vendors" />
        <Tab label="Models" value="models" />
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

      <Box sx={{ flex: 1 }}>
        <DataGrid
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
            createMut.mutate(payload);
          } else {
            createMut.mutate(values);
          }
          setCreateOpen(false);
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
    </Box>
  );
}
