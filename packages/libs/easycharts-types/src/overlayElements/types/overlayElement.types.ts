import z from "zod";
import {
  OverlayElementSchema,
  OverlayElementCreateSchema,
  OverlayElementUpdateSchema,
  OverlayElementOnChartSchema,
  OverlayEdgeOnChartSchema,
} from "../schemas/index.js";

export type OverlayElement = z.infer<typeof OverlayElementSchema>;
export type OverlayElementCreate = z.infer<typeof OverlayElementCreateSchema>;
export type OverlayElementUpdate = z.infer<typeof OverlayElementUpdateSchema>;
export type OverlayElementOnChart = z.infer<typeof OverlayElementOnChartSchema>;
export type OverlayEdgeOnChart = z.infer<typeof OverlayEdgeOnChartSchema>;
