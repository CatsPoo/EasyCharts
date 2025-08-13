import { Identifiable } from "src/generic.interface.js"

export interface Line extends Identifiable{
    type: string //sm-fiber, mm fivre...
    speed ?: string
    label: string
    sourceDeviceId:string
    targeDevicetId:string
}