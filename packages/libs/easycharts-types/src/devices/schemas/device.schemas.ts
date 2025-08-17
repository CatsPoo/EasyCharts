import { IdentifiableSchema } from "src/generic.schema.js";
import z from "zod";

export const DeviceBaseSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  modelId: z.string().min(1),
  ipAddress: z.string(), //.ip({ version: "v4" }).optional(),
});

export const DeviceCreateSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  modelId: z.string().uuid(),
  ipAddress: z.string(), //.ip({ version: "v4" }),
});

export const DeviceUpdateSchema = DeviceCreateSchema.partial();
export const DeviceSchema = IdentifiableSchema.merge(DeviceBaseSchema);
