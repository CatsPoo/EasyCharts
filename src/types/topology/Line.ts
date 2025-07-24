import type { Device } from "./Device";
import type { BaseTopologyEntity } from "./glabalTopology";
import type { Port } from "./Port";
import type { Position } from '../visualization/Position';

export interface LineEdge{
    device:Device
    port ?:Port
    position:Position
}
export interface Line extends BaseTopologyEntity{
    edgeA:LineEdge
    edgeB:LineEdge
}