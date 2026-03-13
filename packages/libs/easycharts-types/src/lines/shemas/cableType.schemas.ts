import z from "zod";
import { AuditableSchema, IdentifiableSchema } from "../../generic.schema.js";
import { PortTypeSchema } from "./portType.schemas.js";

export const CableTypeCreateSchema = z.object({
  name: z.string().min(1).max(50),
  defaultColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a hex color like #RRGGBB"),
  compatiblePortTypeIds: z.array(z.string().uuid()),
});

export const CableTypeUpdateSchema = CableTypeCreateSchema.partial().refine(
  (v) => Object.keys(v).length > 0,
  { message: "At least one field is required" }
);

export const CableTypeSchema = IdentifiableSchema.extend(CableTypeCreateSchema.shape)
  .extend(AuditableSchema.shape)
  .extend({
    compatiblePortTypes: z.array(PortTypeSchema),
  });
