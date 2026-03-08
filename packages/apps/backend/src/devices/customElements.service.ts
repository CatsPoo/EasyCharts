import type { CustomElement, CustomElementCreate, CustomElementUpdate } from '@easy-charts/easycharts-types';
import { HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CustomElementEntity } from './entities/customElement.entity';
import { QueryDto } from '../query/dto/query.dto';
import { CustomElementOnChartEntity } from '../charts/entities/customElementOnChart.entity';

@Injectable()
export class CustomElementsService {
  constructor(
    @InjectRepository(CustomElementEntity)
    private readonly repo: Repository<CustomElementEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CustomElementCreate, createdByUserId: string): Promise<CustomElement> {
    const entity = this.repo.create({ ...dto, createdByUserId });
    return this.repo.save(entity);
  }

  async list(q: QueryDto): Promise<{ rows: CustomElement[]; total: number }> {
    const take = q.pageSize ?? 25;
    const skip = (q.page ?? 0) * take;
    const qb = this.repo.createQueryBuilder('ce');
    if (q.search?.trim()) {
      qb.where('LOWER(ce.name) LIKE :s', { s: `%${q.search.toLowerCase()}%` });
    }
    const allowed = new Set(['name', 'id', 'createdAt', 'updatedAt']);
    const sortBy = q.sortBy && allowed.has(q.sortBy) ? q.sortBy : 'name';
    const sortDir = (q.sortDir ?? 'asc').toUpperCase() as 'ASC' | 'DESC';
    qb.orderBy(`ce.${sortBy}`, sortDir);
    const [rows, total] = await qb.skip(skip).take(take).getManyAndCount();
    return { rows, total };
  }

  async getById(id: string): Promise<CustomElement> {
    const found = await this.repo.findOne({ where: { id } });
    if (!found) throw new NotFoundException('Custom element not found');
    return found;
  }

  async update(id: string, dto: CustomElementUpdate, updatedByUserId: string): Promise<CustomElement> {
    await this.repo.update(id, { ...dto, updatedByUserId });
    return this.getById(id);
  }

  async remove(id: string): Promise<void> {
    const usedCharts = await this.dataSource
      .getRepository(CustomElementOnChartEntity)
      .createQueryBuilder('coc')
      .innerJoin('coc.chart', 'c')
      .select('c.id', 'id')
      .addSelect('c.name', 'name')
      .where('coc.customElementId = :id', { id })
      .getRawMany<{ id: string; name: string }>();

    if (usedCharts.length) {
      throw new HttpException(
        { message: 'Custom element is in use and cannot be deleted', usedIn: usedCharts.map(r => ({ ...r, kind: 'chart' })) },
        HttpStatus.CONFLICT,
      );
    }
    await this.repo.delete(id);
  }
}
