import { IdentifiableSchema } from "../../generic.schema.js";
import z from "zod";
import { ModelSchema } from "./model.schemas.js";
import { VendorSchema } from "./vendor.schemas.js";

export const DeviceBaseSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  model: ModelSchema,
  vendor: VendorSchema,
  ipAddress: z.string(), //.ip({ version: "v4" }).optional(),
});

export const DeviceCreateSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  modelId: z.string(),
  ipAddress: z.string(), //.ip({ version: "v4" }),
});

export const DeviceUpdateSchema = DeviceCreateSchema.partial();
export const DeviceSchema = DeviceBaseSchema.extend(IdentifiableSchema.shape)
