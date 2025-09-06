import { PortSchema } from "../../devices/index.js";
import z from "zod";


export const LineCreateSchema = z.object({
  id: z.string().uuid().optional(),
  sourceDeviceId: z.string().uuid(),
  targetDeviceId: z.string().uuid(),
});

export const LineUpdateSchema = LineCreateSchema.partial();

export const LineSchema = z.object({
  id: z.string().uuid(),
  sourcePort: PortSchema,
  targetPort: PortSchema,

});