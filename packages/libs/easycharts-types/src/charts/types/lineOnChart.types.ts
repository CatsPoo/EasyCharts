import z from "zod";
import { LineOnChartSchema, LineTypeEnum, StrokeTypeEnum } from "../schemas/lineOnChart.schemas.js";

export type LineType = z.infer<typeof LineTypeEnum>;
export type StrokeType = z.infer<typeof StrokeTypeEnum>;
export type LineOnChart = z.infer<typeof LineOnChartSchema>;