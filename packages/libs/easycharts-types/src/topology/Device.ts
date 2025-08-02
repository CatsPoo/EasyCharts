import type { Position } from "../visualization/Position.js";
import type { NamedTopologyEntity } from "./glabalTopology.js";
export interface Device extends NamedTopologyEntity{
    type : string;
    model ?: string;
    vendor ?: string;
    ipAddress ?:string;
    position :Position

}