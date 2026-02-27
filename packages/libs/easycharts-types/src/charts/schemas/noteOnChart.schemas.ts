import z from "zod";
import { PositionSchema } from "./position.schema.js";

export const NoteOnChartSchema = z.object({
  id: z.string().uuid(),
  content: z.string().default(""),
  color: z.string().default("green"),
  position: PositionSchema,
  size: z
    .object({ width: z.number().positive(), height: z.number().positive() })
    .default({ width: 220, height: 130 }),
});
