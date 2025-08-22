import { IdentifiableSchema } from "../../generic.schema.js";
import z from "zod";

export const PortBaseSchema = z.object({
  name: z.string().min(1),
});

export const PortCreateSchema = z.object({
  name: z.string().min(1),
  deviceId: z.string().uuid(),
})

export const PortUpdateSchema = PortBaseSchema.partial().refine(
    v => Object.keys(v).some(key => key !== 'id'),
    { message: 'At least one field (excluding id) is required' }
);

export const PortSchema = IdentifiableSchema.merge(PortBaseSchema);