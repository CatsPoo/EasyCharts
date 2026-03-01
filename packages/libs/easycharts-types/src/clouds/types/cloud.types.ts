import z from "zod";
import { CloudSchema, CloudCreateSchema, CloudUpdateSchema } from "../schemas/cloud.schemas.js";

export type Cloud = z.infer<typeof CloudSchema>;
export type CloudCreate = z.infer<typeof CloudCreateSchema>;
export type CloudUpdate = z.infer<typeof CloudUpdateSchema>;
