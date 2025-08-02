import type { Position } from "@easy-charts/easycharts-types";
import type { NamedTopologyEntity } from "./glabalTopology.js";
export interface Device extends NamedTopologyEntity{
    type : string;
    model ?: string;
    vendor ?: string;
    ipAddress ?:string;
    position :Position

}