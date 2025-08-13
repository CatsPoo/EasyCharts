import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModelEntity } from './entities/model.entity';
import { VendorEntity } from './entities/vendor.entity';
import type { CreateModelDto, UpdateModelDto } from '@easy-charts/easycharts-types';
import { ListModelsQueryDto } from '../query/dto/query.dto';


@Injectable()
export class ModelsService {
  constructor(
    @InjectRepository(ModelEntity)
    private readonly modelsRepo: Repository<ModelEntity>,
    @InjectRepository(VendorEntity)
    private readonly vendorRepo: Repository<VendorEntity>,
  ) {}

  async createModel(dto: CreateModelDto) {
    const model = this.modelsRepo.create({
      name: dto.name,
    });

    if (dto.vendorId) {
      const vendor = await this.vendorRepo.findOne({ where: { id: dto.vendorId } });
      if (!vendor) throw new NotFoundException('Vendor not found');
      model.vendor = vendor;
    }

    return this.modelsRepo.save(model);
  }

  async updateModel(id: string, dto: UpdateModelDto) {
    const model  = await this.modelsRepo.findOne({ where: { id }, relations: ['vendor'] });
    if (!model) throw new NotFoundException('Model not found');

    if (dto.name) model.name = dto.name;

    if (dto.vendorId !== undefined) {
      if (dto.vendorId === null) {
        model.vendor = null;
      } else {
        const vendor = await this.vendorRepo.findOne({ where: { id: dto.vendorId } });
        if (!vendor) throw new NotFoundException('Vendor not found');
        model.vendor = vendor;
      }
    }

    return this.modelsRepo.save(model);
  }

  async listModels(q: ListModelsQueryDto) {
    const take = q.pageSize ?? 25;
    const skip = (q.page ?? 0) * take;

    const qb = this.modelsRepo.createQueryBuilder('m')
      .leftJoinAndSelect('m.vendor', 'v');

    if (q.search?.trim()) {
      qb.andWhere('LOWER(m.name) LIKE :s', { s: `%${q.search.toLowerCase()}%` });
    }

    if (q.vendorId) {
      qb.andWhere('v.id = :vid', { vid: q.vendorId });
    }

    const allowed = new Set(['name', 'createdAt', 'updatedAt', 'id']);
    const sortBy = q.sortBy && allowed.has(q.sortBy) ? q.sortBy : 'name';
    const sortDir = (q.sortDir ?? 'asc').toUpperCase() as 'ASC' | 'DESC';
    qb.orderBy(`m.${sortBy}`, sortDir);

    const [rows, total] = await qb.skip(skip).take(take).getManyAndCount();
    return { rows, total };
  }

  async getModelById(id: string) {
    const found = await this.modelsRepo.findOne({ where: { id } });
    if (!found) throw new NotFoundException('Vendor not found');
    return found;
  }

  async removeModel(id: string) {
    await this.modelsRepo.delete(id);
  }
}
