import z from "zod";
import { DeviceOnChartSchema, HandlesSchema } from "../schemas/deviceOnChart.schemas.js";

export type DeviceOnChart = z.infer<typeof DeviceOnChartSchema>;
export type Handles = z.infer<typeof HandlesSchema>;
export const SIDES = ['left', 'right', 'top', 'bottom'] as const;
export type Side = typeof SIDES[number]