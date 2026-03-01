import z from "zod";
import { CloudOnChartSchema, CloudConnectionOnChartSchema } from "../../clouds/schemas/cloudOnChart.schemas.js";

export type CloudOnChart = z.infer<typeof CloudOnChartSchema>;
export type CloudConnectionOnChart = z.infer<typeof CloudConnectionOnChartSchema>;
