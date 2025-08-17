import z from "zod";
import { PositionSchema } from "../schemas/position.schema.js";

export type Position = z.infer<typeof PositionSchema>;