import z from "zod";
import { PositionSchema } from "../../charts/schemas/position.schema.js";
import { CloudSchema } from "./cloud.schemas.js";

export const CloudConnectionOnChartSchema = z.object({
  id: z.string().uuid(),
  deviceId: z.string().uuid(),
  portId: z.string().uuid(),
  cloudHandle: z.string(), // "left" | "right" | "top" | "bottom"
});

export const CloudOnChartSchema = z.object({
  cloudId: z.string().uuid(),
  cloud: CloudSchema,
  position: PositionSchema,
  connections: z.array(CloudConnectionOnChartSchema).default([]),
});
