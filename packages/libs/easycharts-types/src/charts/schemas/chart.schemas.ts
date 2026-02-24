import z from "zod";
import { AuditableSchema, IdentifiableSchema } from "../../generic.schema.js";
import { BondOnChartSchema } from "./bondOnChart.schemas.js";
import { ChartLockSchema } from "./chartsLocks.schema.js";
import { DeviceOnChartSchema } from "./deviceOnChart.schemas.js";
import { LineOnChartSchema } from "./lineOnChart.schemas.js";
import { NoteOnChartSchema } from "./noteOnChart.schemas.js";



const DeletesSchema = z.object({
  devices: z.array(z.string().uuid()).optional().default([]),
  ports:   z.array(z.string().uuid()).optional().default([]),
  lines:   z.array(z.string().uuid()).optional().default([]),
});


const ChartBaseSchema = z.object({
  name: z.string(),
  description: z.string(),
  devicesOnChart: z.array(DeviceOnChartSchema),
  linesOnChart: z.array(LineOnChartSchema),
  bondsOnChart: z.array(BondOnChartSchema),
  notesOnChart: z.array(NoteOnChartSchema).optional().default([]),
  lock: ChartLockSchema.optional().nullable().default(null),
});
export const ChartSchema = ChartBaseSchema.extend(IdentifiableSchema.shape).extend(AuditableSchema.shape);

export const ChartCreateSchema = ChartBaseSchema.omit({
  lock:true,
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