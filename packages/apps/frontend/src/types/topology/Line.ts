import type { BaseTopologyEntity } from "./glabalTopology";

export interface Line extends BaseTopologyEntity{
    type: string //sm-fiber, mm fivre...
    speed ?: string
    label: string
    sourceDeviceId:string
    targeDevicetId:string
}