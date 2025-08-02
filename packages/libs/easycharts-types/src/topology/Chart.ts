import type { Device } from './Device.js';
import type {NamedTopologyEntity } from './glabalTopology.js';
import type { Line } from './Line.js';

export interface Chart extends NamedTopologyEntity{
    description:string
    devices:Device[]
    lines:Line[]
}

export type chartMetadata = Omit<Chart,'devices' | 'lines'>

export interface Chartsinformation{
    myCharts: chartMetadata[],
    sharedCharts: chartMetadata[]
}

