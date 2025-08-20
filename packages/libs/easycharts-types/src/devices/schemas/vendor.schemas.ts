import { IdentifiableSchema } from "./../../generic.schema.js";
import z from "zod";

export const VendorBaseSchema = z.object({
  name: z.string().min(1),
  iconUrl: z.string().url().optional(),
});

export const VendorCreateSchema = VendorBaseSchema;
export const VendorUpdateSchema = VendorBaseSchema.partial();

export const VendorSchema = IdentifiableSchema.merge(VendorBaseSchema);
