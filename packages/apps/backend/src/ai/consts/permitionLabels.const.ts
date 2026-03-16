import { Permission } from "@easy-charts/easycharts-types";

export const PERMISSION_LABELS: Record<Permission, string> = {
  [Permission.CHART_CREATE]: "create new charts",
  [Permission.CHART_UPDATE]: "update/rename charts",
  [Permission.CHART_DELETE]: "delete charts",
  [Permission.CHART_READ]: "read/view charts",
  [Permission.CHART_SHARE]: "share charts with others",
  [Permission.ASSET_EDIT]: "edit assets (devices, lines, etc.)",
  [Permission.ASSET_DELETE]: "delete assets",
  [Permission.ASSET_CREATE]: "create new assets",
  [Permission.ASSET_READ]: "read/view assets",
  [Permission.USER_MANAGE]: "manage users",
  [Permission.APP_SETTINGS]: "modify application settings",
};
