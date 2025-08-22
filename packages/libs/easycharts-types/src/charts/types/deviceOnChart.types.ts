import z from "zod";
import { DeviceOnChartSchema, HandlesSchema } from "../schemas/deviceOnChart.schemas.js";

export type DeviceOnChart = z.infer<typeof DeviceOnChartSchema>;
export type Handles = z.infer<typeof HandlesSchema>;
