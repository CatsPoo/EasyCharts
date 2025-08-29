import z from "zod";
import { LineCreateSchema, LineSchema, LineUpdateSchema } from "../shemas/line.schemas.js";

export type LineCreate = z.infer<typeof LineCreateSchema>;
export type LineUpdate = z.infer<typeof LineUpdateSchema>;
export type Line = z.infer<typeof LineSchema>;