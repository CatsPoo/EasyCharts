import z from "zod";
import { DeviceOnChartSchema } from "./deviceOnChart.schemas.js";
import { IdentifiableSchema } from "../../generic.schema.js";
import { LineOnChartSchema } from "./lineOnChart.schemas.js";



const DeletesSchema = z.object({
  devices: z.array(z.string().uuid()).optional().default([]),
  ports:   z.array(z.string().uuid()).optional().default([]),
  lines:   z.array(z.string().uuid()).optional().default([]),
});



export const ChartSchema = IdentifiableSchema.extend({
  name: z.string(),
  description: z.string(),
  devicesOnChart: z.array(DeviceOnChartSchema),
  linesOnChart: z.array(LineOnChartSchema),
  createdAt:z.date(),
  createdById:z.string(),
  lockedById : z.string().nullable().default(null)
});

export const ChartCreateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  devicesOnChart: z.array(DeviceOnChartSchema),
  linesOnChart: z.array(LineOnChartSchema),
});
// update = partial(create) + deletes
export const ChartUpdateSchema = ChartCreateSchema.partial().extend({
  deletes: DeletesSchema.optional(),
});

export const ChartMetadataSchema = ChartSchema.omit({
  devicesOnChart: true,
  linesOnChart: true,
});