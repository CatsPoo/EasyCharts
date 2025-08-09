import { Injectable, NotFoundException } from '@nestjs/common';
import { QueryDto } from '../query/dto/query.dto'
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModelEntity } from './entities/model.entity';
import { CreateModelDto, UpdateModelDto } from './dto/model.dto';

@Injectable()
export class ModelsService {
  constructor(
    @InjectRepository(ModelEntity)
    private readonly modelsRepo: Repository<ModelEntity>,
  ) {}

  async createVendor(dto: CreateModelDto) {
    const entity = this.modelsRepo.create(dto);
    return this.modelsRepo.save(entity);
  }

  async listVendors(q: QueryDto) {
    const take = q.pageSize ?? 25;
    const skip = (q.page ?? 0) * take;

    const qb = this.modelsRepo.createQueryBuilder('v');

    if (q.search?.trim()) {
      qb.where('LOWER(v.name) LIKE :s', { s: `%${q.search.toLowerCase()}%` });
    }

    const allowed = new Set(['name', 'id', 'createdAt', 'updatedAt']);
    const sortBy = q.sortBy && allowed.has(q.sortBy) ? q.sortBy : 'name';
    const sortDir = (q.sortDir ?? 'asc').toUpperCase() as 'ASC' | 'DESC';

    qb.orderBy(`v.${sortBy}`, sortDir);

    const [rows, total] = await qb.skip(skip).take(take).getManyAndCount();
    return { rows, total };
  }

  async getVendorById(id: string) {
    const found = await this.modelsRepo.findOne({ where: { id } });
    if (!found) throw new NotFoundException('Vendor not found');
    return found;
  }

  async updateVendor(id: string, dto: UpdateModelDto) {
    await this.modelsRepo.update(id, dto);
    return this.getVendorById(id);
  }

  async removeVendor(id: string) {
    await this.modelsRepo.delete(id);
  }
}
