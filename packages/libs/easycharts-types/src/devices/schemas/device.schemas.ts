import { IdentifiableSchema } from "../../generic.schema.js";
import z from "zod";

export const DeviceBaseSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  model: z.string().min(1),
  vendor: z.string().min(1),
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
