import z from "zod";
import { ChartCreateSchema, ChartMetadataSchema, ChartSchema, ChartUpdateSchema } from "../schemas/chart.schemas.js";

export type ChartCreate = z.infer<typeof ChartCreateSchema>;
export type ChartUpdate = z.infer<typeof ChartUpdateSchema>;
export type Chart = z.infer<typeof ChartSchema>;
export type ChartMetadata = z.infer<typeof ChartMetadataSchema>;