import type { Vendor, VendorCreate, VendorUpdate } from '@easy-charts/easycharts-types';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VendorEntity } from '../devices/entities/vendor.entity';
import { QueryDto } from "../query/dto/query.dto";

@Injectable()
export class VendorsService {
  constructor(
    @InjectRepository(VendorEntity)
    private readonly vendorsRepo: Repository<VendorEntity>,
  ) {}

  async createVendor(dto: VendorCreate) : Promise<Vendor> {
    const entity = this.vendorsRepo.create(dto);
    return this.vendorsRepo.save(entity);
  }

  async listVendors(q: QueryDto) : Promise<{rows:Vendor[],total:number}> {
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

  async getVendorById(id: string):Promise<Vendor> {
    const found = await this.vendorsRepo.findOne({ where: { id } });
    if (!found) throw new NotFoundException('Vendor not found');
    return found;
  }

  async updateVendor(id: string, dto: VendorUpdate) : Promise<Vendor> {
    await this.vendorsRepo.update(id, dto);
    return this.getVendorById(id);
  }

  async removeVendor(id: string) : Promise<void> {
    await this.vendorsRepo.delete(id);
  }
}
