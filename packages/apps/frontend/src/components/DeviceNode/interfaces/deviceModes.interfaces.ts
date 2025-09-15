import type { DeviceOnChart } from "@easy-charts/easycharts-types";
import type { onHandleContextMenuPayload } from "./contexMenue.interfaces";

export interface DeviceNodeData{
    deviceOnChart: DeviceOnChart,
    editMode:boolean,
    updateDeviceOnChart: (deviceOnChart:DeviceOnChart) => void
    onRemoveNode:(deviceId:string) =>void,
    onHandleContextMenu?: onHandleContextMenuPayload
}