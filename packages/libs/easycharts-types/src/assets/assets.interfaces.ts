import { Device } from "src/devices/interfaces/devices.interfaces.js";
import { Model } from "src/devices/interfaces/models.interfaces.js";
import { Vendor } from "src/devices/interfaces/vendors.interfaces.js";

export type AssetMap = {
  devices: Device;
  models: Model;
  vendors: Vendor;
};

export type AssetKind = keyof AssetMap
export type AnyAsset = AssetMap[AssetKind];