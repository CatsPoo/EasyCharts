import { IdentifiableSchema } from "./../../generic.schema.js";
import z from "zod";

export const DeviceTypeBaseSchema = z.object({
  name: z.string().min(1),
});

export const DeviceTypeCreateSchema = DeviceTypeBaseSchema;
export const DeviceTypeUpdateSchema = DeviceTypeBaseSchema.partial().refine(v => Object.keys(v).length > 0, { message: 'At least one field is required' });;

export const DeviceTypeSchema = IdentifiableSchema.merge(DeviceTypeBaseSchema);
