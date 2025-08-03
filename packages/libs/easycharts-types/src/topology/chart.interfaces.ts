import type {DeviceLocation, NamedTopologyEntity } from './genericTopology.interfaces.js';
import type { Line } from './lines.interfaces.ts.js';


export interface Chart extends NamedTopologyEntity{
    description:string
    devicesLocations:DeviceLocation[]
    lines:Line[]
}

export type chartMetadata = Omit<Chart,'devicesLocations' | 'lines'>

export interface Chartsinformation{
    myCharts: chartMetadata[],
    sharedCharts: chartMetadata[]
}

