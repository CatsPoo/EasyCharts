import z from "zod";
import { DeviceTypeCreateSchema, DeviceTypeSchema, DeviceTypeUpdateSchema } from "../schemas/deviceTypes.schemas.js";

export type DeviceTypeCreate = z.infer<typeof DeviceTypeCreateSchema>;
export type DeviceTypeUpdate = z.infer<typeof DeviceTypeUpdateSchema>;
export type DeviceType = z.infer<typeof DeviceTypeSchema>;