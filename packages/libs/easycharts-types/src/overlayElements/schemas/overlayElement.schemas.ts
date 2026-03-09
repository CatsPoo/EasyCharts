import { AuditableSchema, IdentifiableSchema } from "../../generic.schema.js";
import z from "zod";

export const OverlayElementBaseSchema = z.object({
  name: z.string().min(1),
  isSystem: z.boolean().default(false),
  imageUrl: z.string().optional(),
});

export const OverlayElementCreateSchema = OverlayElementBaseSchema;

// isSystem is immutable after creation — exclude it from updates
export const OverlayElementUpdateSchema = OverlayElementBaseSchema
  .omit({ isSystem: true })
  .partial()
  .refine(
    (v) => Object.keys(v).length > 0,
    { message: "At least one field is required" }
  );

export const OverlayElementSchema = IdentifiableSchema
  .extend(OverlayElementBaseSchema.shape)
  .extend(AuditableSchema.shape);
