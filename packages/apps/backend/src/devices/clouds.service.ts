import type { Cloud, CloudCreate, CloudUpdate } from '@easy-charts/easycharts-types';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CloudEntity } from './entities/cloud.entity';
import { QueryDto } from '../query/dto/query.dto';

@Injectable()
export class CloudsService {
  constructor(
    @InjectRepository(CloudEntity)
    private readonly cloudsRepo: Repository<CloudEntity>,
  ) {}

  async createCloud(dto: CloudCreate, createdByUserId: string): Promise<Cloud> {
    const entity = this.cloudsRepo.create({ ...dto, createdByUserId });
    return this.cloudsRepo.save(entity);
  }

  async listClouds(q: QueryDto): Promise<{ rows: Cloud[]; total: number }> {
    const take = q.pageSize ?? 25;
    const skip = (q.page ?? 0) * take;

    const qb = this.cloudsRepo.createQueryBuilder('c');

    if (q.search?.trim()) {
      qb.where('LOWER(c.name) LIKE :s', { s: `%${q.search.toLowerCase()}%` });
    }

    const allowed = new Set(['name', 'id', 'createdAt', 'updatedAt']);
    const sortBy = q.sortBy && allowed.has(q.sortBy) ? q.sortBy : 'name';
    const sortDir = (q.sortDir ?? 'asc').toUpperCase() as 'ASC' | 'DESC';

    qb.orderBy(`c.${sortBy}`, sortDir);

    const [rows, total] = await qb.skip(skip).take(take).getManyAndCount();
    return { rows, total };
  }

  async getCloudById(id: string): Promise<Cloud> {
    const found = await this.cloudsRepo.findOne({ where: { id } });
    if (!found) throw new NotFoundException('Cloud not found');
    return found;
  }

  async updateCloud(id: string, dto: CloudUpdate, updatedByUserId: string): Promise<Cloud> {
    await this.cloudsRepo.update(id, { ...dto, updatedByUserId });
    return this.getCloudById(id);
  }

  async removeCloud(id: string): Promise<void> {
    await this.cloudsRepo.delete(id);
  }
}
