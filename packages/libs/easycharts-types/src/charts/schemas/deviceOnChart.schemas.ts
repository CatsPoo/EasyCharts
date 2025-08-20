import z from "zod";
import { PositionSchema } from "./position.schema.js";
import { DeviceSchema } from "../../devices/index.js";

export const DeviceOnChartSchema = z.object({
  chartId:z.string().uuid(),
  device: DeviceSchema,
  position: PositionSchema,
});

