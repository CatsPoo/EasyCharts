import z from "zod";
import {
  ChartsDirectorySchema,
  ChartShareSchema,
  CreateChartDirectorySchema,
  DirectoryShareSchema,
  ShareWithUserSchema,
  UpdateChartsDirectorySchema,
} from "../schemas/chartsDirectories.schema.js";

export type ChartsDirectory = z.infer<typeof ChartsDirectorySchema>;
export type UpadateChartDirectory = z.infer<typeof UpdateChartsDirectorySchema>;
export type CreateChartDirectory = z.infer<typeof CreateChartDirectorySchema>;
export type ShareWithUser = z.infer<typeof ShareWithUserSchema>;
export type ChartShare = z.infer<typeof ChartShareSchema>;
export type DirectoryShare = z.infer<typeof DirectoryShareSchema>;