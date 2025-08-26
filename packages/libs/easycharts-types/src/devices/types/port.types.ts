import z from "zod";
import { PortCreateSchema, PortSchema, PortUpdateSchema } from "../schemas/port.schemas.js";

export type PortCreate = z.infer<typeof PortCreateSchema>;
export type PortUpdate = z.infer<typeof PortUpdateSchema>;
export type Port = z.infer<typeof PortSchema>;

export const PortTypeValues = ["rj45", "sfp","qsfp"] as const;
export type PortType = (typeof PortTypeValues)[number];
