import z from "zod";
import { PositionSchema } from "./position.schema.js";
import { DeviceSchema } from "../../devices/index.js";

export const HandlesSchema = z.object({
  left: z.array(z.string().uuid()).optional().default([]),
  right: z.array(z.string().uuid()).optional().default([]),
  top: z.array(z.string().uuid()).optional().default([]),
  bottom: z.array(z.string().uuid()).optional().default([]),
}).default({ left: [], right: [], top: [], bottom: [] });

export const DeviceOnChartSchema = z.object({
  chartId: z.string().uuid(),
  device: DeviceSchema,
  position: PositionSchema,
  handles: HandlesSchema
});
