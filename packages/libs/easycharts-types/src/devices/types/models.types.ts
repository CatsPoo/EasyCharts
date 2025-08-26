import z from "zod";
import { ModelCreateSchema, ModelSchema, ModelUpdateSchema } from "../schemas/model.schemas.js";

export type ModelCreate = z.infer<typeof ModelCreateSchema>;
export type ModelUpdate = z.infer<typeof ModelUpdateSchema>;
export type Model = z.infer<typeof ModelSchema>;