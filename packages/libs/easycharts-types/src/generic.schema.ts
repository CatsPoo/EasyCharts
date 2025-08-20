import {z} from "zod";

export const IdentifiableSchema = z.object({
  id: z.string().uuid(),
});