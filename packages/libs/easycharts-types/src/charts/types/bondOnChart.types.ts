import z from "zod";
import { BondOnChartSchema } from "../schemas/bondOnChart.schemas.js";

export type BondOnChart = z.infer<typeof BondOnChartSchema>;