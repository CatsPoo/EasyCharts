import type { DeviceOnChart, Handles } from "@easy-charts/easycharts-types";

export interface DeviceNodeData{
    deviceOnChart: DeviceOnChart,
    editMode:boolean,
    updateHandles: (deviceId:string, handles:Handles) => void
}