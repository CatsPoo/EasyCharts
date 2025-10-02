import type { AssetKind, Device, Model } from "@easy-charts/easycharts-types";
import type { GridColDef } from "@mui/x-data-grid";

export const columns: Record<AssetKind, GridColDef[]> = {
  devices: [
    { field: "name", headerName: "Name", flex: 1 },
    { field: "type", headerName: "Type", width: 140 },
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
  ],
};
