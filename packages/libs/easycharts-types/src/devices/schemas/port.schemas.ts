import { IdentifiableSchema } from "../../generic.schema.js";
import z from "zod";
import { PortTypeValues } from "../types/port.types.js";

export const PortBaseSchema = z.object({
  name: z.string().min(1),
  deviceId: z.string().uuid(),
  type: z.enum(PortTypeValues),
  inUse: z.boolean().default(false),
});

export const PortCreateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  deviceId: z.string().uuid(),
  type: z.enum(PortTypeValues),
  inUse: z.boolean().default(false),
});

export const PortUpdateSchema = PortBaseSchema.partial().refine(
    v => Object.keys(v).some(key => key !== 'id'),
    { message: 'At least one field (excluding id) is required' }
);

export const PortSchema = IdentifiableSchema.merge(PortBaseSchema);