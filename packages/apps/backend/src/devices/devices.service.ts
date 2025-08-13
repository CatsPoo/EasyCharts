import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeviceEntity } from './entities/device.entity';
import type  { CreateDeviceDto, UpdateDeviceDto } from '@easy-charts/easycharts-types';                          
import { ModelEntity } from './entities/model.entity';
import { QueryDto } from '../query/dto/query.dto';

@Injectable()
export class DevicesService {
  constructor(
    @InjectRepository(DeviceEntity)
    private readonly devicesRepo: Repository<DeviceEntity>,
    @InjectRepository(ModelEntity)
    private readonly modelsRepo: Repository<ModelEntity>,
  ) {}

  async createDevice(dto: CreateDeviceDto): Promise<DeviceEntity> {
    const model = await this.modelsRepo.findOne({ where: { id: dto.modelId }, relations: ['vendor'] });
    if (!model) throw new NotFoundException('Model not found');

    const device = this.devicesRepo.create({
      ...dto,
      model
    });
    return this.devicesRepo.save(device);
  }

 async listDevices(q: QueryDto) {
    const take = q.pageSize ?? 25;
    const skip = (q.page ?? 0) * take;

    const qb = this.devicesRepo.createQueryBuilder('d')
      .leftJoinAndSelect('d.model', 'm')
      .leftJoinAndSelect('m.vendor', 'v');

    if (q.search?.trim()) {
      qb.andWhere('LOWER(d.name) LIKE :s', { s: `%${q.search.toLowerCase()}%` });
    }

    // allow client sort keys, map to real columns
    const mapSort: Record<string, string> = {
      id: 'd.id',
      name: 'd.name',
      type: 'd.type',
      ipAddress: 'd.ipAddress',
      model: 'm.name',
      vendor: 'v.name',
      //createdAt: 'd.createdAt',
      //updatedAt: 'd.updatedAt',
    };

    const sortKey = q.sortBy && mapSort[q.sortBy] ? mapSort[q.sortBy] : 'd.name';
    const sortDir = (q.sortDir ?? 'asc').toUpperCase() as 'ASC' | 'DESC';
    qb.orderBy(sortKey, sortDir);

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
    const device = await this.devicesRepo.findOne({ where: { id }, relations: ['model', 'model.vendor'] });
    if (!device) throw new NotFoundException('Device not found');

    if (dto.name !== undefined) device.name = dto.name;
    if (dto.type !== undefined) device.type = dto.type;
    if (dto.ipAddress !== undefined) device.ipAddress = dto.ipAddress;

    if (dto.modelId !== undefined) {
      const model = await this.modelsRepo.findOne({ where: { id: dto.modelId }, relations: ['vendor'] });
      if (!model) throw new NotFoundException('Model not found');
      device.model = model;
    }

    return this.devicesRepo.save(device);
  }

  async removeDevice(id: string): Promise<void> {
    const result = await this.devicesRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Device ${id} not found`);
    }
  }
}
