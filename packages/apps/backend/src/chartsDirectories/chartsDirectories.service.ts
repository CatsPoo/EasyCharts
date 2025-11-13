import type { CreateChartDirectory, UpadateChartDirectory } from "@easy-charts/easycharts-types";
import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ILike, Repository } from "typeorm";
import { ChartsDirectoryEntity } from "./entities/chartsDirectory.entity";
import { ChartInDirectoryEntity } from "./entities/chartsInDirectory.entity";

@Injectable()
export class ChartsDirectoriesService {
  constructor(
    @InjectRepository(ChartsDirectoryEntity)
    private readonly dirRepo: Repository<ChartsDirectoryEntity>,
    @InjectRepository(ChartsDirectoryEntity)
    private readonly cidRepo: Repository<ChartInDirectoryEntity>,
  ) {}

  async createChartsDirectory(dto: CreateChartDirectory, currentUserId: string) {
    const parentId = dto.parentId ?? null;
    await this.ensureNameUniqueAmongSiblings(dto.name, parentId);

    if (parentId) {
      const parent = await this.dirRepo.findOne({ where: { id: parentId } });
      if (!parent) throw new BadRequestException("Parent directory does not exist");
    }

    const entity = this.dirRepo.create({...dto,createdByUserId:currentUserId});
    return this.dirRepo.save(entity);
  }

  async getChartsDirectoryById(id: string) {
    const dir = await this.dirRepo.findOne({ where: { id } });
    if (!dir) throw new NotFoundException("Directory not found");
    return dir;
  }

  async updateChartsDirectory(id: string, dto: UpadateChartDirectory, currentUserId: string) {
    const dir = await this.dirRepo.findOne({ where: { id } });
    if (!dir) throw new NotFoundException("Directory not found");

    // name change with sibling uniqueness
    if (dto.name && dto.name !== dir.name) {
      const parentScope = dto.parentId ?? dir.parentId ?? null;
      await this.ensureNameUniqueAmongSiblings(dto.name, parentScope, id);
      dir.name = dto.name;
    }

    // move (parent change)
    if (dto.parentId !== undefined && dto.parentId !== dir.parentId) {
      const newParentId = dto.parentId ?? null;
      if (newParentId) {
        const parent = await this.dirRepo.findOne({ where: { id: newParentId } });
        if (!parent) throw new BadRequestException("New parent directory does not exist");
      }
      await this.assertNoCycle(id, newParentId);
      await this.ensureNameUniqueAmongSiblings(dir.name, newParentId, id);
      dir.parentId = newParentId;
    }

    if (dto.description !== undefined) {
      dir.description = dto.description ?? "";
    }

    dir.updatedByUserId = currentUserId
    return this.dirRepo.save(dir);
  }

  /**
   * Hard delete. Children are kept and become roots (FK on parent is SET NULL).
   * If you prefer to block delete when children exist, add a guard here.
   */
  async remove(id: string) {
    const exists = await this.dirRepo.exist({ where: { id } });
    if (!exists) throw new NotFoundException("Directory not found");
    await this.dirRepo.delete({ id });
  }

  async search(q: string) {
    const like = `%${q}%`;
    return this.dirRepo.find({
      where: [{ name: ILike(like) }, { description: ILike(like) }],
      order: { name: "ASC" },
    });
  }

  async listRoots() {
    return this.dirRepo.find({
      where: { parentId: undefined },
      order: { name: "ASC" },
    });
  }

  async listChildren(parentId: string) {
    return this.dirRepo.find({
      where: { parentId },
      order: { name: "ASC" },
    });
  }

  async move(directoryId: string, newParentId: string | null, currentUserId: string) {
    return this.updateChartsDirectory(directoryId, { parentId: newParentId }, currentUserId);
  }

   async listChartIds(directoryId: string): Promise<string[]> {
    await this.getChartsDirectoryById(directoryId);
    const rows = await this.cidRepo.find({
      select: ["chartId"],
      where: { directoryId },
    });
    return rows.map(r => r.chartId);
  }

  /**
   * Return full membership rows (with pinned/sortOrder/note/addedAt).
   */
  async listCharts(directoryId: string): Promise<ChartInDirectoryEntity[]> {
    await this.getChartsDirectoryById(directoryId);
    return this.cidRepo.find({
      where: { directoryId },
    });
  }

  /**
   * Add/Upsert a single chart membership.
   */
  async addChart(
    directoryId: string,
    chartId: string,
    addedByUserId: string,
  ): Promise<void> {
    await this.getChartsDirectoryById(directoryId);
    await this.cidRepo.upsert(
      {
        directoryId,
        chartId,
        addedByUserId,
      } as ChartInDirectoryEntity,
      { conflictPaths: ["directoryId", "chartId"], skipUpdateIfNoValuesChanged: true },
    );
  }

  /**
   * Remove a single chart from a directory.
   */
  async removeChart(directoryId: string, chartId: string): Promise<void> {
    const res = await this.cidRepo.delete({ directoryId, chartId });
    if (!res.affected) {
      throw new NotFoundException("Chart is not in this directory");
    }
  }

  private async ensureNameUniqueAmongSiblings(
      name: string,
      parentId: string | null,
      excludeId?: string,
    ) {
      const qb = this.dirRepo
        .createQueryBuilder("d")
        .where("d.name = :name", { name })
        .andWhere("(d.parant_directory_id IS NOT DISTINCT FROM :pid)", { pid: parentId });
  
      if (excludeId) qb.andWhere("d.directory_id <> :excludeId", { excludeId });
  
      const exists = await qb.getExists();
      if (exists) throw new BadRequestException(
        "A directory with the same name already exists in this parent"
      );
    }
    private async assertNoCycle(directoryId: string, newParentId: string | null) {
      if (!newParentId) return;
      let cursor: string | null = newParentId;

      for (let i = 0; i < 1024 && cursor; i++) {
        if (cursor === directoryId) {
          throw new BadRequestException(
            "Cannot move a directory under itself or its descendants"
          );
        }
        const parent = await this.dirRepo.findOne({
          select: ["id", "parentId"],
          where: { id: cursor },
        });
        if (!parent) break;
        cursor = parent.parentId;
      }
    }
}