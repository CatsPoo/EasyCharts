import { AuditableSchema, IdentifiableSchema } from "../../generic.schema.js";
import z from "zod";
import { PortTypeValues } from "../types/port.types.js";

export const PortBaseSchema = z.object({
  name: z.string().min(1),
  deviceId: z.uuid(),
  type: z.enum(PortTypeValues),
  inUse: z.boolean().default(false),
  connectedPortId: z.string().uuid().optional(),
});

export const PortCreateSchema = PortBaseSchema.extend(IdentifiableSchema.shape)

export const PortUpdateSchema = PortBaseSchema.partial().refine(
    v => Object.keys(v).some(key => key !== 'id'),
    { message: 'At least one field (excluding id) is required' }
);

export const PortSchema = PortCreateSchema.extend(AuditableSchema.shape)