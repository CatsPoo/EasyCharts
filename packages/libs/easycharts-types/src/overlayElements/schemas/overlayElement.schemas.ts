import { AuditableSchema, IdentifiableSchema } from "../../generic.schema.js";
import z from "zod";

export const OverlayElementTypeSchema = z.enum(["cloud", "customElement"]);

export const OverlayElementBaseSchema = z.object({
  name: z.string().min(1),
  type: OverlayElementTypeSchema,
  description: z.string().optional(),
  imageUrl: z.string().optional(),
});

export const OverlayElementCreateSchema = OverlayElementBaseSchema;

export const OverlayElementUpdateSchema = OverlayElementBaseSchema.partial().refine(
  (v) => Object.keys(v).length > 0,
  { message: "At least one field is required" }
);

export const OverlayElementSchema = IdentifiableSchema
  .extend(OverlayElementBaseSchema.shape)
  .extend(AuditableSchema.shape);
