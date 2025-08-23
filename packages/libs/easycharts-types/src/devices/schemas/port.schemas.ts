import { IdentifiableSchema } from "../../generic.schema.js";
import z from "zod";


export const PortTypeValues = ["rj45", "sfp","qsfp"] as const;

export const PortBaseSchema = z.object({
  name: z.string().min(1),
  deviceId: z.string().uuid(),
  type: z.enum(PortTypeValues),
});

export const PortCreateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  deviceId: z.string().uuid(),
  type: z.enum(PortTypeValues)
});

export const PortUpdateSchema = PortBaseSchema.partial().refine(
    v => Object.keys(v).some(key => key !== 'id'),
    { message: 'At least one field (excluding id) is required' }
);

export const PortSchema = IdentifiableSchema.merge(PortBaseSchema);