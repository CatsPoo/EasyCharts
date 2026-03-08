import z from "zod";
import { FiberTypeEnum, LineOnChartSchema, LineTypeEnum } from "../schemas/lineOnChart.schemas.js";

export type LineType = z.infer<typeof LineTypeEnum>;
export type FiberType = z.infer<typeof FiberTypeEnum>;
export type LineOnChart = z.infer<typeof LineOnChartSchema>;