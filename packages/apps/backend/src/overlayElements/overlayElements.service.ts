import type {
  OverlayElement,
  OverlayElementCreate,
  OverlayElementUpdate,
} from '@easy-charts/easycharts-types';
import { HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { OverlayElementEntity } from '../devices/entities/overlayElement.entity';
import { QueryDto } from '../query/dto/query.dto';
import { OverlayElementOnChartEntity } from '../charts/entities/overlayElementOnChart.entity';

@Injectable()
export class OverlayElementsService {
  constructor(
    @InjectRepository(OverlayElementEntity)
    private readonly repo: Repository<OverlayElementEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: OverlayElementCreate, createdByUserId: string): Promise<OverlayElement> {
    const entity = this.repo.create({ ...dto, createdByUserId });
    return this.repo.save(entity) as unknown as OverlayElement;
  }

  async list(q: QueryDto): Promise<{ rows: OverlayElement[]; total: number }> {
    const take = q.pageSize ?? 25;
    const skip = (q.page ?? 0) * take;
    const qb = this.repo.createQueryBuilder('oe');

    if (q.search?.trim()) {
      qb.andWhere('LOWER(oe.name) LIKE :s', { s: `%${q.search.toLowerCase()}%` });
    }

    const allowed = new Set(['name', 'id', 'createdAt', 'updatedAt']);
    const sortBy = q.sortBy && allowed.has(q.sortBy) ? q.sortBy : 'name';
    const sortDir = (q.sortDir ?? 'asc').toUpperCase() as 'ASC' | 'DESC';
    qb.orderBy(`oe.${sortBy}`, sortDir);

    const [rows, total] = await qb.skip(skip).take(take).getManyAndCount();
    return { rows: rows as unknown as OverlayElement[], total };
  }

  async getById(id: string): Promise<OverlayElement> {
    const found = await this.repo.findOne({ where: { id } });
    if (!found) throw new NotFoundException('Overlay element not found');
    return found as unknown as OverlayElement;
  }

  async update(id: string, dto: OverlayElementUpdate, updatedByUserId: string): Promise<OverlayElement> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { isSystem: _ignored, ...safe } = dto as any;
    await this.repo.update(id, { ...safe, updatedByUserId });
    return this.getById(id);
  }

  async remove(id: string): Promise<void> {
    const usedCharts = await this.dataSource
      .getRepository(OverlayElementOnChartEntity)
      .createQueryBuilder('oec')
      .innerJoin('oec.chart', 'c')
      .select('c.id', 'id')
      .addSelect('c.name', 'name')
      .where('oec.overlayElementId = :id', { id })
      .getRawMany<{ id: string; name: string }>();

    if (usedCharts.length) {
      throw new HttpException(
        {
          message: 'Overlay element is in use and cannot be deleted',
          usedIn: usedCharts.map((r) => ({ ...r, kind: 'chart' })),
        },
        HttpStatus.CONFLICT,
      );
    }
    await this.repo.delete(id);
  }
}
