import z from "zod";
import { CableTypeCreateSchema, CableTypeSchema, CableTypeUpdateSchema } from "../shemas/cableType.schemas.js";

export type CableTypeCreate = z.infer<typeof CableTypeCreateSchema>;
export type CableTypeUpdate = z.infer<typeof CableTypeUpdateSchema>;
export type CableType = z.infer<typeof CableTypeSchema>;
