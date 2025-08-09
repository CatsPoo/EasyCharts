import type { NamedTopologyEntity } from "././genericTopology.interfaces.js";
export interface Device extends NamedTopologyEntity{
    type : string;
    model ?: string;
    vendor ?: string;
    ipAddress ?:string;
}

export interface CreateDeviceDto {
  device : Device
}

export interface UpdateDeviceDto{
  device:Device
}