import z from "zod";
import { PositionSchema } from "./position.schema.js";

export const ZoneOnChartSchema = z.object({
  id: z.string().uuid(),
  label: z.string().default(""),
  shape: z.enum(["rectangle", "ellipse"]).default("rectangle"),
  color: z.string().default("blue"),
  fillColor: z.string().default(""),
  fillOpacity: z.number().min(0).max(1).default(0),
  borderStyle: z.enum(["solid", "dashed", "dotted"]).default("solid"),
  borderWidth: z.number().min(0).max(10).default(2),
  position: PositionSchema,
  size: z
    .object({ width: z.number().positive(), height: z.number().positive() })
    .default({ width: 300, height: 200 }),
});

export type ZoneOnChart = z.infer<typeof ZoneOnChartSchema>;
