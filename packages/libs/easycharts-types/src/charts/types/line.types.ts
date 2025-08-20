import z from "zod";
import { LineCreateSchema, LineSchema, LineTypeEnum, LineUpdateSchema } from "../schemas/line.schemas.js";

export type LineType = z.infer<typeof LineTypeEnum>;
export type LineCreate = z.infer<typeof LineCreateSchema>;
export type LineUpdate = z.infer<typeof LineUpdateSchema>;
export type Line = z.infer<typeof LineSchema>;