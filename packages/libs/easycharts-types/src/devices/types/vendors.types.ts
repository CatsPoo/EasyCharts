import z from "zod";
import { VendorCreateSchema, VendorUpdateSchema, VendorSchema } from "../schemas/vendor.schemas.js";

export type VendorCreate = z.infer<typeof VendorCreateSchema>;
export type VendorUpdate = z.infer<typeof VendorUpdateSchema>;
export type Vendor = z.infer<typeof VendorSchema>;