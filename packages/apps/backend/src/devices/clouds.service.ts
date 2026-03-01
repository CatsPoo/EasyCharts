import type { Cloud, CloudCreate, CloudUpdate } from '@easy-charts/easycharts-types';
import { HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CloudEntity } from './entities/cloud.entity';
import { QueryDto } from '../query/dto/query.dto';
import { AssetVersionsService } from './assetVersions.service';
import { CloudOnChartEntity } from '../charts/entities/cloudOnChart.entity';

@Injectable()
export class CloudsService {
  constructor(
    @InjectRepository(CloudEntity)
    private readonly cloudsRepo: Repository<CloudEntity>,
    private readonly assetVersionsService: AssetVersionsService,
    private readonly dataSource: DataSource,
  ) {}

  async createCloud(dto: CloudCreate, createdByUserId: string): Promise<Cloud> {
    const entity = this.cloudsRepo.create({ ...dto, createdByUserId });
    const result = await this.cloudsRepo.save(entity);
    await this.assetVersionsService.saveVersion("clouds", result.id, result as unknown as object, createdByUserId);
    return result;
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
    const result = await this.getCloudById(id);
    await this.assetVersionsService.saveVersion("clouds", result.id, result as unknown as object, updatedByUserId);
    return result;
  }

  async removeCloud(id: string): Promise<void> {
    const usedCharts = await this.dataSource
      .getRepository(CloudOnChartEntity)
      .createQueryBuilder("coc")
      .innerJoin("coc.chart", "c")
      .select("c.id", "id")
      .addSelect("c.name", "name")
      .where("coc.cloudId = :id", { id })
      .getRawMany<{ id: string; name: string }>();

    if (usedCharts.length) {
      throw new HttpException(
        { message: 'Cloud is in use and cannot be deleted', usedIn: usedCharts.map(r => ({ ...r, kind: 'chart' })) },
        HttpStatus.CONFLICT,
      );
    }
    await this.cloudsRepo.delete(id);
  }
}
