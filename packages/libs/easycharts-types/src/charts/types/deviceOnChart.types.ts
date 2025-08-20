import z from "zod";
import { DeviceOnChartSchema } from "../schemas/deviceOnChart.schemas.js";

export type DeviceOnChart = z.infer<typeof DeviceOnChartSchema>;
