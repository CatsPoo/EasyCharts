import z from "zod";
import { DeviceCreateSchema, DeviceSchema, DeviceUpdateSchema } from "./../schemas/device.schemas.js";

export type DeviceCreate = z.infer<typeof DeviceCreateSchema>;
export type DeviceUpdate = z.infer<typeof DeviceUpdateSchema>;
export type Device = z.infer<typeof DeviceSchema>;