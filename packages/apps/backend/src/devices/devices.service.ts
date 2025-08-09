import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeviceEntity } from './entities/device.entity';
import { CreateDeviceDto, UpdateDeviceDto } from './dto/devices.dto'; 
import { QueryDto } from '@easy-charts/easycharts-types';                          

@Injectable()
export class DevicesService {
  constructor(
    @InjectRepository(DeviceEntity)
    private readonly devicesRepo: Repository<DeviceEntity>,
  ) {}

  async createDevice(dto: CreateDeviceDto): Promise<DeviceEntity> {
    const entity = this.devicesRepo.create(dto);
    return this.devicesRepo.save(entity);
  }

  async listDevices(q: QueryDto) {
    const take = q.pageSize ?? 25;
    const skip = (q.page ?? 0) * take;

    const qb = this.devicesRepo.createQueryBuilder('d');

    if (q.search?.trim()) {
      qb.where('LOWER(d.name) LIKE :s', { s: `%${q.search.toLowerCase()}%` });
    }

    // Allowlist columns that actually exist on DeviceEntity
    const allowed = new Set<keyof DeviceEntity>([
      'name',
      'type',
      'vendor',
      'model',
      'ipAddress',
      'id',
      // add 'createdAt', 'updatedAt' only if your entity has them
    ]);
    const sortBy = (q.sortBy && allowed.has(q.sortBy as any)) ? q.sortBy! : 'name';
    const sortDir = (q.sortDir ?? 'asc').toUpperCase() as 'ASC' | 'DESC';

    qb.orderBy(`d.${sortBy}`, sortDir);

    const [rows, total] = await qb.skip(skip).take(take).getManyAndCount();
    return { rows, total };
  }

  getAllDevices(): Promise<DeviceEntity[]> {
    return this.devicesRepo.find();
  }

  async getDeviceById(id: string): Promise<DeviceEntity> {
    const device = await this.devicesRepo.findOne({ where: { id } });
    if (!device) throw new NotFoundException(`Device ${id} not found`);
    return device;
  }

  async updateDevice(id: string, dto: UpdateDeviceDto): Promise<DeviceEntity> {
    await this.devicesRepo.update(id, dto);
    return this.getDeviceById(id);
  }

  async removeDevice(id: string): Promise<void> {
    const result = await this.devicesRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Device ${id} not found`);
    }
  }
}
