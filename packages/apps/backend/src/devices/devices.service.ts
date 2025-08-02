import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeviceEntity } from './entities/device.entity';
import { Repository } from 'typeorm';
import { CreateDevicePayload, UpdateDevicePayload } from './dto/devices.dto';
import { Device } from '@easy-charts/easycharts-types';

@Injectable()
export class DevicesService {
    constructor(
        @InjectRepository(DeviceEntity)
        private readonly devicesRepo: Repository<DeviceEntity>,) {
    }

    async createDevice(createDevicePayload: CreateDevicePayload): Promise<Device> {
        const {device} = createDevicePayload
        const newDevice:DeviceEntity = this.devicesRepo.create(device);
        return this.devicesRepo.save(newDevice);
    }

    async getDevice(id: string): Promise<Device> {
        const device = await this.devicesRepo.findOne({ where: { id } });
        if (!device) throw new NotFoundException(`Device ${id} not found`);
        return device;
     }

    async update(id: string, updateDevicePayload: UpdateDevicePayload): Promise<Device> {
        const {device} = updateDevicePayload
        await this.devicesRepo.update(id, device);
        return this.getDevice(id);
    }

    async remove(id: string): Promise<void> {
        const result = await this.devicesRepo.delete(id);
        if (result.affected === 0) {
            throw new NotFoundException(`Device ${id} not found`);
        }
    }
}
