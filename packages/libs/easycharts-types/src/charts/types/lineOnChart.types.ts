import z from "zod";
import { LineOnChartSchema, LineTypeEnum } from "../schemas/lineOnChart.schemas.js";

export type LineType = z.infer<typeof LineTypeEnum>;
export type LineOnChart = z.infer<typeof LineOnChartSchema>;