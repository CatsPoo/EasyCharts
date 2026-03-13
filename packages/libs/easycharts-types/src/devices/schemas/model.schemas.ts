import z from "zod";
import { AuditableSchema, IdentifiableSchema } from "../..//generic.schema.js";
import { VendorSchema } from "./vendor.schemas.js";

export const ModelBaseSchema = z.object({
  name: z.string().min(1),
  vendor: VendorSchema,
  iconUrl: z.string().optional(),
});

export const ModelCreateSchema = z.object({
  name: z.string().min(1),
  vendorId: z.string().uuid().optional(),
  iconUrl: z.string().optional(),
});

export const ModelUpdateSchema = ModelCreateSchema.partial();

export const ModelSchema = IdentifiableSchema.extend(ModelBaseSchema.shape).extend(AuditableSchema.shape);
