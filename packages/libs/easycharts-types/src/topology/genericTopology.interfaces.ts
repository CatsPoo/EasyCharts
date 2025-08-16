import { Identifiable } from "../generic.interface.js";
import { Device } from "../devices/interfaces/devices.interfaces.js"
import { Position } from '../charts/interfaces/position.interface.js';

export interface NamedTopologyEntity extends Identifiable{
    name:string
}

export interface DeviceLocation{
    device:Device
    position:Position
}