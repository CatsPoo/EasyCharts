import z from "zod";
import { PortTypeCreateSchema, PortTypeSchema, PortTypeUpdateSchema } from "../shemas/portType.schemas.js";

export type PortTypeCreate = z.infer<typeof PortTypeCreateSchema>;
export type PortTypeUpdate = z.infer<typeof PortTypeUpdateSchema>;
export type PortType = z.infer<typeof PortTypeSchema>;
