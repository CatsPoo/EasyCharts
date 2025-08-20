import z from "zod";
import { IdentifiableSchema } from "./generic.schema.js";

export type Identifiable = z.infer<typeof IdentifiableSchema>;

export const NamedTopologyEntitySchema = IdentifiableSchema.extend({
  name: z.string().min(1),
});
