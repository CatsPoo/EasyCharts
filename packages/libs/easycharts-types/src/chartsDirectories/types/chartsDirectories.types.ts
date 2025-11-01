import z from "zod";
import { ChartsDirectorySchema, CreateChartDirectorySchema, UpdateChartsDirectorySchema } from "../schemas/chartsDirectories.schema.js";

export type ChartsDirectory = z.infer<typeof ChartsDirectorySchema>;
export type UpadateChartDirectory = z.infer<typeof UpdateChartsDirectorySchema>;
export type CreateChartDirectory = z.infer<typeof CreateChartDirectorySchema>;