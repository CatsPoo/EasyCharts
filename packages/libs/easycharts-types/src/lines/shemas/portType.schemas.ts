import z from "zod";
import { AuditableSchema, IdentifiableSchema } from "../../generic.schema.js";

export const PortTypeCreateSchema = z.object({
  name: z.string().min(1).max(50),
});

export const PortTypeUpdateSchema = PortTypeCreateSchema.partial().refine(
  (v) => Object.keys(v).length > 0,
  { message: "At least one field is required" }
);

export const PortTypeSchema = IdentifiableSchema.extend(PortTypeCreateSchema.shape).extend(AuditableSchema.shape);
