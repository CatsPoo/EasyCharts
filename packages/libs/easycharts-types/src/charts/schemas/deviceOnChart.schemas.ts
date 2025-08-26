import z from "zod";
import { PositionSchema } from "./position.schema.js";
import { DeviceSchema, PortSchema } from "../../devices/index.js";

export const handleSchema = z.object({
  port: PortSchema,
  direction: z.enum(["source", "target"]),
  inUse: z.boolean().default(false),
});

  export const HandlesSchema = z.object({
  left: z.array(handleSchema).default([]),
  right: z.array(handleSchema).default([]),
  top: z.array(handleSchema).default([]),
  bottom: z.array(handleSchema).default([]),
}).default({ left: [], right: [], top: [], bottom: [] });

export const DeviceOnChartSchema = z.object({
  chartId: z.string().uuid(),
  device: DeviceSchema,
  position: PositionSchema,
  handles: HandlesSchema
});
