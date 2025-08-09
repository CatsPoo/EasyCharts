import { Device } from "src/topology/devices.interfaces.js";

export type AssetMap = {
  devices: Device;
//   models: Model;
//   vendors: Vendor;
};

export type AssetKind = keyof AssetMap
export type AnyAsset = AssetMap[AssetKind];