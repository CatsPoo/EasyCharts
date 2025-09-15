import { DeviceSchema } from "../devices/index.js";
import { ModelBaseSchema } from "..//devices/schemas/model.schemas.js";
import { VendorSchema } from "../devices/schemas/vendor.schemas.js";
import z from "zod";
import { Identifiable } from "src/generic.types.js";

// 1) AssetKind — same literal keys
export const assetKinds = ["devices", "models", "vendors"] as const;
export type AssetKind = typeof assetKinds[number]; // "devices" | "models" | "vendors"

// 2) AssetMap — map each key to the *view* type you expose externally
export type AssetMap = {
  devices: z.infer<typeof DeviceSchema>;
  models: z.infer<typeof ModelBaseSchema>;
  vendors: z.infer<typeof VendorSchema>;
};

// 3) AnyAsset — union of the mapped types
export type AnyAsset = AssetMap[AssetKind] & Identifiable;