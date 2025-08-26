import z from "zod";

export const PositionSchema = z.object({
  x: z.number().finite(),
  y: z.number().finite(),
});