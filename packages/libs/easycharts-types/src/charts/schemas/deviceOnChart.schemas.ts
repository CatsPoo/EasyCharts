import z from "zod";
import { PositionSchema } from "./position.schema.js";
import { DeviceSchema, PortSchema } from "../../devices/index.js";

export const HandlesSchema = z.object({
  left: z.array(PortSchema).default([]),
  right: z.array(PortSchema).default([]),
  top: z.array(PortSchema).default([]),
  bottom: z.array(PortSchema).default([]),
}).default({ left: [], right: [], top: [], bottom: [] });

export const DeviceOnChartSchema = z.object({
  chartId: z.string().uuid(),
  device: DeviceSchema,
  position: PositionSchema,
  handles: HandlesSchema
});
