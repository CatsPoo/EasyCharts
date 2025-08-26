import z from "zod";
import { IdentifiableSchema } from "../..//generic.schema.js";
import { VendorSchema } from "./vendor.schemas.js";

export const ModelBaseSchema = z.object({
  name: z.string().min(1),
  vendor: VendorSchema,
  iconUrl: z.string().url().optional(),
});

export const ModelCreateSchema = z.object({
  name: z.string().min(1),
  vendorId: z.string().uuid().optional(),
  iconUrl: z.string().url().optional(),    // from your CreateModelDto
});

export const ModelUpdateSchema = ModelCreateSchema.partial();

export const ModelSchema = IdentifiableSchema.merge(ModelBaseSchema);
