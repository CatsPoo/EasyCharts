import {z} from "zod";

export const IdentifiableSchema = z.object({
  id: z.uuid(),
});

export const AuditableSchema = z.object({
  createdAt: z.date(),
  createdByUserId: z.uuid(),
  updatedAt: z.date().nullable(),
  updatedByUserId: z.uuid().nullable(),
});