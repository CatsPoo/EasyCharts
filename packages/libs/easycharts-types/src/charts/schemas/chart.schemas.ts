import z from "zod";
import { DeviceOnChartSchema } from "./deviceOnChart.schemas.js";
import { IdentifiableSchema } from "../../generic.schema.js";
import { LineOnChartSchema } from "./lineOnChart.schemas.js";


export const ChartCreateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  devicesOnChart: z.array(DeviceOnChartSchema),
  linesOnChart: z.array(LineOnChartSchema)
});

export const ChartUpdateSchema = ChartCreateSchema.partial();

export const ChartSchema = IdentifiableSchema.extend({
  name: z.string(),
  description: z.string(),
  devicesOnChart: z.array(DeviceOnChartSchema),
  linesOnChart: z.array(LineOnChartSchema)
});

export const ChartMetadataSchema = ChartSchema.omit({
  devicesOnChart: true,
  linesOnChart: true,
});