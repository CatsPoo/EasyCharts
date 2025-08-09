import { Identifiable } from "src/generic.interface.js";
import { Device } from "./devices.interfaces.js";
import { Position } from '../visualization/position.interface.js';

export interface NamedTopologyEntity extends Identifiable{
    name:string
}

export interface DeviceLocation{
    device:Device
    position:Position
}