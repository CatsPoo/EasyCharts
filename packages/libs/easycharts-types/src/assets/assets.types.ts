import { DeviceSchema, DeviceTypeSchema } from "../devices/index.js";
import { ModelBaseSchema } from "..//devices/schemas/model.schemas.js";
import { VendorSchema } from "../devices/schemas/vendor.schemas.js";
import { OverlayElementSchema } from "../overlayElements/schemas/overlayElement.schemas.js";
import { PortTypeSchema } from "../lines/shemas/portType.schemas.js";
import { CableTypeSchema } from "../lines/shemas/cableType.schemas.js";
import z from "zod";
import { Identifiable } from "src/generic.types.js";

// 1) AssetKind — same literal keys
export const assetKinds = ["devices", "types", "models", "vendors", "overlayElements", "portTypes", "cableTypes"] as const;
export type AssetKind = (typeof assetKinds)[number];

// 2) AssetMap — map each key to the *view* type you expose externally
export type AssetMap = {
  devices: z.infer<typeof DeviceSchema>;
  types: z.infer<typeof DeviceTypeSchema>;
  models: z.infer<typeof ModelBaseSchema>;
  vendors: z.infer<typeof VendorSchema>;
  overlayElements: z.infer<typeof OverlayElementSchema>;
  portTypes: z.infer<typeof PortTypeSchema>;
  cableTypes: z.infer<typeof CableTypeSchema>;
};

// 3) AnyAsset — union of the mapped types
export type AnyAsset = AssetMap[AssetKind] & Identifiable;
