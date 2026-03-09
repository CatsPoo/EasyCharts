import type { AssetKind, Device, Model } from "@easy-charts/easycharts-types";
import type { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import { Box, Chip } from "@mui/material";

export const columns: Record<AssetKind, GridColDef[]> = {
  overlayElements: [
    { field: "name", headerName: "Name", flex: 1 },
    { field: "isSystem", headerName: "System", width: 100, type: "boolean" },
    {
      field: "imageUrl",
      headerName: "Image",
      width: 100,
      sortable: false,
      renderCell: (params: GridRenderCellParams) =>
        params.value ? (
          <img
            src={params.value}
            alt="preview"
            style={{ height: 36, width: 36, objectFit: "contain", borderRadius: 4 }}
          />
        ) : null,
    },
  ],
  devices: [
    { field: "name", headerName: "Name", flex: 1 },
    {
      field: "type",
      headerName: "Type",
      width: 160,
      valueGetter: (_v, row: Device & { type?: { name?: string } }) =>
        row.type?.name ?? "",
    },
    {
      field: "model",
      headerName: "Model",
      width: 160,
      valueGetter: (_v, row: Device & { model?: { name?: string } }) =>
        row.model?.name ?? "",
    },
    {
      field: "vendor",
      headerName: "Vendor",
      width: 160,
      valueGetter: (
        _v,
        row: Device & { model?: { vendor?: { name?: string } } }
      ) => row.model?.vendor?.name ?? "",
    },
    { field: "ipAddress", headerName: "IP", width: 140 },
  ],
  types: [{ field: "name", headerName: "Name", flex: 1 }],
  vendors: [{ field: "name", headerName: "Name", flex: 1 }],
  models: [
    { field: "name", headerName: "Name", flex: 1 },
    {
      field: "vendor",
      headerName: "Vendor",
      width: 160,
      valueGetter: (_value, row: Model) => row.vendor?.name,
    },
    {
      field: "iconUrl",
      headerName: "Icon",
      width: 80,
      sortable: false,
      renderCell: (params: GridRenderCellParams) =>
        params.value ? (
          <img
            src={params.value}
            alt="icon"
            style={{ height: 36, width: 36, objectFit: "contain", borderRadius: 4 }}
          />
        ) : null,
    },
  ],
  portTypes: [{ field: "name", headerName: "Name", flex: 1 }],
  cableTypes: [
    { field: "name", headerName: "Name", flex: 1 },
    {
      field: "defaultColor",
      headerName: "Color",
      width: 100,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box sx={{ width: 18, height: 18, borderRadius: "50%", bgcolor: params.value, border: "1px solid #ccc" }} />
          {params.value}
        </Box>
      ),
    },
    {
      field: "compatiblePortTypes",
      headerName: "Compatible Port Types",
      flex: 1,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, py: 0.5 }}>
          {(params.value ?? []).map((pt: any) => (
            <Chip key={pt.id} label={pt.name} size="small" />
          ))}
        </Box>
      ),
    },
  ],
};
