import z from "zod";
import { PositionSchema } from "./position.schema.js";

export const DeviceOnChartSchema = z.object({
  deviceId: z.string().uuid(),
  position: PositionSchema,
});

