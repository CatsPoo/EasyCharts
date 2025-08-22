import type { Port, PortCreate, PortUpdate } from '@easy-charts/easycharts-types';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QueryDto } from "../query/dto/query.dto";
import { PortEntity } from './entities/port.entity';

@Injectable()
export class PortsService {
  constructor(
    @InjectRepository(PortEntity)
    private readonly portsRepo: Repository<PortEntity>,
  ) {}

  async createPort(dto: PortCreate) : Promise<Port> {
    const entity = this.portsRepo.create(dto);
    return this.portsRepo.save(entity);
  }

  async listPorts(q: QueryDto) : Promise<{rows:Port[],total:number}> {
    const take = q.pageSize ?? 25;
    const skip = (q.page ?? 0) * take;

    const qb = this.portsRepo.createQueryBuilder('v');

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

  async getPortrById(id: string):Promise<Port> {
    const found = await this.portsRepo.findOne({ where: { id } });
    if (!found) throw new NotFoundException('Port not found');
    return found;
  }

  async updatePort(id: string, dto: PortUpdate) : Promise<Port> {
    await this.portsRepo.update(id, dto);
    return this.getPortrById(id);
  }

  async removePort(id: string) : Promise<void> {
    await this.portsRepo.delete(id);
  }
}
