import type { DeviceOnChart } from "@easy-charts/easycharts-types";

export interface DeviceNodeData{
    deviceOnChart: DeviceOnChart,
    editMode:boolean,
    updateDeviceOnChart: (deviceOnChart:DeviceOnChart) => void
    onRemoveNode:(deviceId:string) =>void,
    onHandleContextMenu?: (
    e: React.MouseEvent,
    info: { deviceId: string; portId: string; role: 'source' | 'target'; side?: 'left' | 'right' | 'top' | 'bottom' }
  ) => void;
}