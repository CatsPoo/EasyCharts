import { AuditableSchema, IdentifiableSchema } from "../../generic.schema.js";
import z from "zod";

export const CloudBaseSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

export const CloudCreateSchema = CloudBaseSchema;
export const CloudUpdateSchema = CloudBaseSchema.partial().refine(
  (v) => Object.keys(v).length > 0,
  { message: "At least one field is required" }
);

export const CloudSchema = IdentifiableSchema.extend(CloudBaseSchema.shape).extend(AuditableSchema.shape);
