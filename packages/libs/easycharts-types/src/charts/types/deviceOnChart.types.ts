import z from "zod";
import { DeviceOnChartSchema, handleSchema, HandlesSchema } from "../schemas/deviceOnChart.schemas.js";

export type DeviceOnChart = z.infer<typeof DeviceOnChartSchema>;
export type HandleInfo = z.infer<typeof handleSchema>;
export type Handles = z.infer<typeof HandlesSchema>;
export const SIDES = ['left', 'right', 'top', 'bottom'] as const;
export type Side = typeof SIDES[number]