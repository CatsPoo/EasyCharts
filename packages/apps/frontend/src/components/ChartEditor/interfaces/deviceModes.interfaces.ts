import type { DeviceOnChart } from "@easy-charts/easycharts-types";

export interface DeviceNodeData{
    deviceOnChart: DeviceOnChart,
    editMode:boolean,
    updateDeviceOnChart: (deviceOnChart:DeviceOnChart) => void
}