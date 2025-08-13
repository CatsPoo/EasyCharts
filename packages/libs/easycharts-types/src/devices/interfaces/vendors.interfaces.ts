import { Identifiable } from "src/generic.interface.js";

export interface Vendor extends Identifiable{
    name:string
    iconUrl ?: string
}