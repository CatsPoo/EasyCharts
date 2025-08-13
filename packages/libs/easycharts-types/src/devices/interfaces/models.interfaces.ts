import { Identifiable } from "src/generic.interface";
import { Vendor } from "./vendors.interfaces";

export interface Model extends Identifiable{
    name: string,
    vendor:Vendor
}