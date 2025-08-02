import type { Position } from "../visualization/Position";
import type { NamedTopologyEntity } from "./glabalTopology.js";
export interface Device extends NamedTopologyEntity{
    type : string;
    model ?: string;
    vendor ?: string;
    ipAddress ?:string;
    position :Position

}