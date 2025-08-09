import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeviceEntity } from './entities/device.entity';
import { Repository } from 'typeorm';
import { CreateDeviceDto, UpdateDeviceDto } from '@easy-charts/easycharts-types';
import { Device } from '@easy-charts/easycharts-types';
import { QueryDto} from '@easy-charts/easycharts-types';
@Injectable()
export class DevicesService {
    constructor(
        @InjectRepository(DeviceEntity)
        private readonly devicesRepo: Repository<DeviceEntity>,) {
    }

    async createDevice(createDeviceDto: CreateDeviceDto): Promise<Device> {
        const {device} = createDeviceDto
        const newDevice:DeviceEntity = this.devicesRepo.create(device);
        return this.devicesRepo.save(newDevice);
    }

    async listDevices(q: QueryDto) {
        const take = q.pageSize ?? 25;
        const skip = (q.page ?? 0) * take;

        const qb = this.devicesRepo.createQueryBuilder('d');

        if (q.search?.trim()) {
        qb.where('LOWER(d.name) LIKE :s', { s: `%${q.search.toLowerCase()}%` });
        }

        // basic allowlist to avoid injection on sortBy
        const allowed = new Set(['name', 'type', 'vendor', 'model', 'createdAt', 'updatedAt', 'id']);
        const sortBy = q.sortBy && allowed.has(q.sortBy) ? q.sortBy : 'name';
        const sortDir = (q.sortDir ?? 'asc').toUpperCase() as 'ASC' | 'DESC';
        qb.orderBy(`d.${sortBy}`, sortDir);

        const [rows, total] = await qb.skip(skip).take(take).getManyAndCount();
        return { rows, total };
    }

    getAllDevices(): Promise<Device[]> {
        return this.devicesRepo.find();
    }
    async getDeviceById(id: string): Promise<Device> {
        const device = await this.devicesRepo.findOne({ where: { id } });
        if (!device) throw new NotFoundException(`Device ${id} not found`);
        return device;
     }

    async updateDevice(id: string, updateDeviceDto: UpdateDeviceDto): Promise<Device> {
        const {device} = updateDeviceDto
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
