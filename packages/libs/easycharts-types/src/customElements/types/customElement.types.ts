import z from "zod";
import {
  CustomElementSchema,
  CustomElementCreateSchema,
  CustomElementUpdateSchema,
  CustomElementOnChartSchema,
  CustomElementEdgeOnChartSchema,
} from "../schemas/index.js";

export type CustomElement = z.infer<typeof CustomElementSchema>;
export type CustomElementCreate = z.infer<typeof CustomElementCreateSchema>;
export type CustomElementUpdate = z.infer<typeof CustomElementUpdateSchema>;
export type CustomElementOnChart = z.infer<typeof CustomElementOnChartSchema>;
export type CustomElementEdgeOnChart = z.infer<typeof CustomElementEdgeOnChartSchema>;
