import { LineSchema } from "../../lines/index.js";
import z from "zod";


export const LineTypeEnum = z.enum([
  "straight",
  "step",
  "smoothstep",
  "bezier",
  "simplebezier",
]);

export const CableTypeEnum = z.enum(["single_mode", "multimode", "copper"]);

export const LineOnChartSchema = z.object({
  chartId: z.string().uuid(),
  line: LineSchema,
  type:LineTypeEnum,
  label: z.string().min(1).default(""),
  cableType: CableTypeEnum.optional(),
  color: z.string().optional(),
});