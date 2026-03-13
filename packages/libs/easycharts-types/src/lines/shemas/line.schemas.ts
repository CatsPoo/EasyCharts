import { AuditableSchema } from "../../generic.schema.js";
import { PortSchema } from "../../devices/index.js";
import z from "zod";

export const LineCreateSchema = z.object({
  id: z.uuid().optional(),
  sourceDeviceId: z.uuid(),
  targetDeviceId: z.uuid(),
});

export const LineUpdateSchema = LineCreateSchema.partial();

export const LineSchema = z.object({
  id: z.uuid(),
  sourcePort: PortSchema,
  targetPort: PortSchema,
  cableType: z.string().optional(),
}).extend(AuditableSchema.shape);