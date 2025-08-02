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

    getAllDevices(): Promise<Device[]> {
        return this.devicesRepo.find();
    }
    async getDeviceById(id: string): Promise<Device> {
        const device = await this.devicesRepo.findOne({ where: { id } });
        if (!device) throw new NotFoundException(`Device ${id} not found`);
        return device;
     }

    async updateDevice(id: string, updateDevicePayload: UpdateDevicePayload): Promise<Device> {
        const {device} = updateDevicePayload
        await this.devicesRepo.update(id, device);
        return this.getDeviceById(id);
    }

    async removeDevice(id: string): Promise<void> {
        const result = await this.devicesRepo.delete(id);
        if (result.affected === 0) {
            throw new NotFoundException(`Device ${id} not found`);
        }
    }
}
