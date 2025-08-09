import { Injectable, NotFoundException } from '@nestjs/common';
import { VendorEntity } from './entities/vendor.entity';
import { CreateVendorDto, UpdateVendorDto } from '@easy-charts/easycharts-types';
import { QueryDto } from './../query/dto/query.dto'
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class VendorsService {
  constructor(
    @InjectRepository(VendorEntity)
    private readonly vendorsRepo: Repository<VendorEntity>,
  ) {}

  async createVendor(dto: CreateVendorDto) {
    const entity = this.vendorsRepo.create(dto);
    return this.vendorsRepo.save(entity);
  }

  async listVendors(q: QueryDto) {
    const take = q.pageSize ?? 25;
    const skip = (q.page ?? 0) * take;

    const qb = this.vendorsRepo.createQueryBuilder('v');

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
    const found = await this.vendorsRepo.findOne({ where: { id } });
    if (!found) throw new NotFoundException('Vendor not found');
    return found;
  }

  async updateVendor(id: string, dto: UpdateVendorDto) {
    await this.vendorsRepo.update(id, dto);
    return this.getVendorById(id);
  }

  async removeVendor(id: string) {
    await this.vendorsRepo.delete(id);
  }
}
