import z from "zod";
import { DeviceOnChartSchema } from "./deviceOnChart.schemas.js";
import { IdentifiableSchema } from "../../generic.schema.js";
import { LineOnChartSchema } from "./lineOnChart.schemas.js";
import { ChartLockSchema } from "./chartsLocks.schema.js";
import { BondSchema } from "src/lines/index.js";
import { BondOnChartSchema } from "./bondOnChart.schemas.js";



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
  bondsOnChart:z.array(BondOnChartSchema),
  createdAt:z.date(),
  createdById:z.string(),
  lock : ChartLockSchema.optional().nullable().default(null)
});

export const ChartCreateSchema = ChartSchema.omit({
  createdAt:true,
  createdById:true,
  lock:true,
  id:true
})
// update = partial(create) + deletes
export const ChartUpdateSchema = ChartCreateSchema.partial().extend({
  deletes: DeletesSchema.optional(),
});

export const ChartMetadataSchema = ChartSchema.omit({
  devicesOnChart: true,
  linesOnChart: true,
  bondsOnChart:true
});