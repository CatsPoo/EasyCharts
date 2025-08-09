import { Identifiable } from "src/generic.interface.js";
import { Vendor } from "./vendors.interfaces.js";

export interface Model extends Identifiable{
    name: string,
    vendor:Vendor
}