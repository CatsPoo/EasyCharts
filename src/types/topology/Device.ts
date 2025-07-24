import type { Position } from "../visualization/Position";
import type { NamedTopologyEntity } from "./glabalTopology";
export interface Device extends NamedTopologyEntity{
    type : string;
    model : string;
    vendor: string;
    ipAddress ?:string;
    position:Position

}