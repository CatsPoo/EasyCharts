import z from "zod";
import { DeviceOnChartSchema } from "./deviceOnChart.schemas.js";
import { IdentifiableSchema } from "../../generic.schema.js";
import { LineSchema } from "./line.schemas.js";

export const ChartCreateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  devicesLocations: z.array(DeviceOnChartSchema),
  // lines: z.array(LineSchema).optional() // re-enable when you define Line
});

export const ChartUpdateSchema = ChartCreateSchema.partial();

export const ChartSchema = IdentifiableSchema.extend({
  name: z.string(),
  description: z.string(),
  devicesLocations: z.array(DeviceOnChartSchema),
  lines: z.array(LineSchema)
});

export const ChartMetadataSchema = ChartSchema.omit({
  devicesLocations: true,
  lines: true,
});