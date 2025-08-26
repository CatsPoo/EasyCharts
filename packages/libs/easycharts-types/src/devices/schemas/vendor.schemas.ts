import { IdentifiableSchema } from "./../../generic.schema.js";
import z from "zod";

export const VendorBaseSchema = z.object({
  name: z.string().min(1),
});

export const VendorCreateSchema = VendorBaseSchema;
export const VendorUpdateSchema = VendorBaseSchema.partial().refine(v => Object.keys(v).length > 0, { message: 'At least one field is required' });;

export const VendorSchema = IdentifiableSchema.merge(VendorBaseSchema);
