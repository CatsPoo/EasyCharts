import { LineSchema } from "../../lines/index.js";
import z from "zod";


export const LineTypeEnum = z.enum([
  "straight",
  "step",
  "smoothstep",
  "bezier",
  "simplebezier",
]);

export const StrokeTypeEnum = z.enum([
  "solid",
  "dashed",
  "dotted",
  "long-dashed",
]);

export const LineOnChartSchema = z.object({
  chartId: z.string().uuid(),
  line: LineSchema,
  type:LineTypeEnum,
  label: z.string().min(1).default(""),
  color: z.string().optional(),
  strokeType: StrokeTypeEnum.optional().default("solid"),
});