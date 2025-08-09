// AssetPage.tsx
import { Box, Tabs, Tab, Toolbar, Button, TextField } from '@mui/material';
import { DataGrid, GridPaginationModel, GridSortModel } from '@mui/x-data-grid';
import { useMemo, useState } from 'react';
import { columns } from './AsetColumn';
import { useListAssets, useCreateAsset, useUpdateAsset, useDeleteAsset } from '../../hooks/assetsHooks';
import type { AssetKind, AnyAsset } from '@easy-charts/easycharts-types';
import { AssetForm } from './AssetsForm';

export default function AssetPage() {
  const [kind, setKind] = useState<AssetKind>('devices');
  const [pagination, setPagination] = useState<GridPaginationModel>({ page: 0, pageSize: 25 });
  const [sortModel, setSortModel] = useState<GridSortModel>([]);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<AnyAsset | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const sort = sortModel[0];
  const sortBy  = sort?.field;
  const sortDir: 'asc' | 'desc' | undefined =
  sort?.sort === 'asc' || sort?.sort === 'desc' ? sort.sort : undefined;
  
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

  const cols = useMemo(() => [
    ...columns[kind],
    {
      field: '__actions',
      headerName: '',
      width: 160,
      sortable: false,
      renderCell: (params: any) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button size="small" onClick={() => setEditing(params.row)}>Edit</Button>
          <Button size="small" color="error" onClick={() => deleteMut.mutate(params.row.id)}>Delete</Button>
        </Box>
      )
    }
  ], [kind, deleteMut]);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Tabs value={kind} onChange={(_, v) => setKind(v)}>
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
        <Button variant="contained" onClick={() => setCreateOpen(true)}>New {kind.slice(0, -1)}</Button>
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
        />
      </Box>

      <AssetForm
        kind={kind}
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={(values) => { createMut.mutate(values); setCreateOpen(false); }}
      />

      {editing && (
        <AssetForm
          kind={kind}
          open
          initial={editing as any}
          onClose={() => setEditing(null)}
          onSubmit={(values) => {
      
      const payload = { id: (editing as any).id, ...values }; // ⭐
      updateMut.mutate(payload);
      setEditing(null);
    }}
        />
      )}
    </Box>
  );
}
