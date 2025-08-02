import type { Device } from './Device';
import type {NamedTopologyEntity } from './glabalTopology';
import type { Line } from './Line';

export interface Chart extends NamedTopologyEntity{
    description:string
    devices:Device[]
    lines:Line[]
}

