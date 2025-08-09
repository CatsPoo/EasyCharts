import { Device } from "src/devices/devices.interfaces.js";
import { Vendor } from "src/vendors/vendors.interfaces.js";

export type AssetMap = {
  devices: Device;
//   models: Model;
  vendors: Vendor;
};

export type AssetKind = keyof AssetMap
export type AnyAsset = AssetMap[AssetKind];