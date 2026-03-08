import { AuditableSchema, IdentifiableSchema } from "../../generic.schema.js";
import z from "zod";

export const CustomElementBaseSchema = z.object({
  name: z.string().min(1),
  imageUrl: z.string().url().optional().or(z.literal("")),
});

export const CustomElementCreateSchema = CustomElementBaseSchema;
export const CustomElementUpdateSchema = CustomElementBaseSchema.partial().refine(
  (v) => Object.keys(v).length > 0,
  { message: "At least one field is required" }
);

export const CustomElementSchema = IdentifiableSchema
  .extend(CustomElementBaseSchema.shape)
  .extend(AuditableSchema.shape);
