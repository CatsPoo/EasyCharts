import type { DeviceOnChart, Side } from "@easy-charts/easycharts-types";
import type { onHandleContextMenuPayload } from "./contexMenue.interfaces";

export interface DeviceNodeData{
    deviceOnChart: DeviceOnChart,
    editMode:boolean,
    updateDeviceOnChart: (deviceOnChart:DeviceOnChart) => void
    onRemoveNode:(deviceId:string) =>void,
    onHandleContextMenu?: onHandleContextMenuPayload,
    greenPortIds: Set<string>,
    overlayPortIds: Set<string>,
    onPortAdded?: (portId: string, deviceId: string, side: Side) => void,
}