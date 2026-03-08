import z from "zod";
import { CableTypeEnum, LineOnChartSchema, LineTypeEnum } from "../schemas/lineOnChart.schemas.js";

export type LineType = z.infer<typeof LineTypeEnum>;
export type CableType = z.infer<typeof CableTypeEnum>;
export type LineOnChart = z.infer<typeof LineOnChartSchema>;