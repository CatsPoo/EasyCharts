import { IdentifiableSchema } from "../../generic.schema.js";
import z from "zod";
import { ModelSchema } from "./model.schemas.js";
import { VendorSchema } from "./vendor.schemas.js";
import { PortSchema } from "./port.schemas.js";
import { DeviceTypeSchema } from "./deviceTypes.schemas.js";

export const DeviceBaseSchema = z.object({
  name: z.string().min(1),
  type: DeviceTypeSchema,
  model: ModelSchema,
  vendor: VendorSchema,
  ipAddress: z.string(), //.ip({ version: "v4" }).optional(),
  ports: z.array(PortSchema).default([]),
});

export const DeviceCreateSchema = z.object({
  name: z.string().min(1),
  typeId: z.string(),
  modelId: z.string(),
  ipAddress: z.string(), //.ip({ version: "v4" }),
  portsIds: z.array(z.string()).default([]),
});

export const DeviceUpdateSchema = DeviceCreateSchema.partial()
.refine(v => Object.keys(v).length > 0, { message: 'At least one field is required' });

export const DeviceSchema = DeviceBaseSchema.extend(IdentifiableSchema.shape)

export const DeviceMetadataSchema = DeviceSchema.omit({
  ports: true,
});
