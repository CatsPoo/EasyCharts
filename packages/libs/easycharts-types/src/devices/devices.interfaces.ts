import type { NamedTopologyEntity } from "../topology/genericTopology.interfaces.js";
export interface Device extends NamedTopologyEntity{
    type : string;
    model ?: string;
    vendor ?: string;
    ipAddress ?:string;
}