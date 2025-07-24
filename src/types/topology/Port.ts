import type { NamedTopologyEntity } from "./glabalTopology";

export interface Port extends NamedTopologyEntity{
    type:string //rj45, sfp, qsf, ext...
}