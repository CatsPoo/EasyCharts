import type { ChartMetadata, CreateChartDirectory, UpadateChartDirectory } from "@easy-charts/easycharts-types";
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ILike, Repository } from "typeorm";
import { ChartsService } from "../charts/charts.service";
import { ChartEntity } from "../charts/entities/chart.entity";
import { ChartShareEntity } from "../charts/entities/chartShare.entity";
import { ChartsDirectoryEntity } from "./entities/chartsDirectory.entity";
import { ChartInDirectoryEntity } from "./entities/chartsInDirectory.entity";
import { DirectoryShareEntity } from "./entities/directoryShare.entity";

@Injectable()
export class ChartsDirectoriesService {
  constructor(
    @InjectRepository(ChartsDirectoryEntity)
    private readonly dirRepo: Repository<ChartsDirectoryEntity>,
    @InjectRepository(ChartInDirectoryEntity)
    private readonly cidRepo: Repository<ChartInDirectoryEntity>,
    @InjectRepository(DirectoryShareEntity)
    private readonly shareDirRepo: Repository<DirectoryShareEntity>,
    @InjectRepository(ChartEntity)
    private readonly chartRepo: Repository<ChartEntity>,
    @InjectRepository(ChartShareEntity)
    private readonly chartShareRepo: Repository<ChartShareEntity>,
    private readonly chartsService: ChartsService,
  ) {}

  // ─── Private permission helpers ─────────────────────────────────────────────

  private async assertDirectoryPermission(
    directoryId: string,
    userId: string,
    permission: "canEdit" | "canDelete" | "canShare",
  ): Promise<void> {
    const dir = await this.dirRepo.findOne({ where: { id: directoryId }, select: { createdByUserId: true } });
    if (!dir) throw new NotFoundException("Directory not found");
    if (dir.createdByUserId === userId) return; // owner has full access
    const share = await this.shareDirRepo.findOne({ where: { directoryId, sharedWithUserId: userId } });
    if (!share?.[permission]) throw new ForbiddenException(`No ${permission} permission on this directory`);
  }

  // ─── CRUD ────────────────────────────────────────────────────────────────────

  async createChartsDirectory(dto: CreateChartDirectory, currentUserId: string) {
    const parentId = dto.parentId ?? null;
    await this.ensureNameUniqueAmongSiblings(dto.name, parentId);

    if (parentId) {
      const parent = await this.dirRepo.findOne({ where: { id: parentId } });
      if (!parent) throw new BadRequestException("Parent directory does not exist");
    }

    const entity = this.dirRepo.create({ ...dto, createdByUserId: currentUserId });
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

    // Resource-level permission: owner OR shared with canEdit
    if (dir.createdByUserId !== currentUserId) {
      const share = await this.shareDirRepo.findOne({ where: { directoryId: id, sharedWithUserId: currentUserId } });
      if (!share?.canEdit) throw new ForbiddenException("No edit permission on this directory");
    }

    if (dto.name && dto.name !== dir.name) {
      const parentScope = dto.parentId ?? dir.parentId ?? null;
      await this.ensureNameUniqueAmongSiblings(dto.name, parentScope, id);
      dir.name = dto.name;
    }

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

    dir.updatedByUserId = currentUserId;
    return this.dirRepo.save(dir);
  }

  async remove(id: string, currentUserId: string) {
    await this.assertDirectoryPermission(id, currentUserId, "canDelete");
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

  /** Root directories owned by OR shared with userId */
  async listRoots(userId: string): Promise<ChartsDirectoryEntity[]> {
    return this.dirRepo
      .createQueryBuilder("d")
      .leftJoin(
        DirectoryShareEntity,
        "ds",
        "ds.directory_id::text = d.id::text AND ds.shared_with_user_id::text = :userId",
        { userId },
      )
      .where("d.parant_id IS NULL")
      .andWhere("(d.created_by_user_id::text = :userId OR ds.shared_with_user_id IS NOT NULL)", { userId })
      .orderBy("d.name", "ASC")
      .getMany();
  }

  /** Children of a directory that are owned by OR shared with userId */
  async listChildren(parentId: string, userId: string): Promise<ChartsDirectoryEntity[]> {
    return this.dirRepo
      .createQueryBuilder("d")
      .leftJoin(
        DirectoryShareEntity,
        "ds",
        "ds.directory_id::text = d.id::text AND ds.shared_with_user_id::text = :userId",
        { userId },
      )
      .where("d.parant_id::text = :parentId", { parentId })
      .andWhere("(d.created_by_user_id::text = :userId OR ds.shared_with_user_id IS NOT NULL)", { userId })
      .orderBy("d.name", "ASC")
      .getMany();
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

  async listCharts(directoryId: string): Promise<ChartInDirectoryEntity[]> {
    await this.getChartsDirectoryById(directoryId);
    return this.cidRepo.find({ where: { directoryId } });
  }

  /** Charts in a directory that the user has access to (owned or shared) */
  async listChartsMetadata(directoryId: string, userId: string): Promise<ChartMetadata[]> {
    await this.getChartsDirectoryById(directoryId);
    const charts = await this.chartRepo
      .createQueryBuilder("c")
      .innerJoin(
        "charts_in_directories", "cid",
        "cid.chart_id = c.id::text AND cid.directory_id::text = :directoryId",
        { directoryId },
      )
      .leftJoin(
        ChartShareEntity, "cs",
        "cs.chart_id::text = c.id::text AND cs.shared_with_user_id::text = :userId",
        { userId },
      )
      .where("(c.created_by_user_id::text = :userId OR cs.shared_with_user_id IS NOT NULL)", { userId })
      .leftJoinAndSelect("c.lockedBy", "lb")
      .getMany();
    return this.chartsService.buildChartMetadataWithPrivileges(charts, userId);
  }

  async addChart(directoryId: string, chartId: string, addedByUserId: string): Promise<void> {
    await this.getChartsDirectoryById(directoryId);
    await this.cidRepo.upsert(
      { directoryId, chartId, addedByUserId } as ChartInDirectoryEntity,
      { conflictPaths: ["directoryId", "chartId"], skipUpdateIfNoValuesChanged: true },
    );
  }

  async removeChart(directoryId: string, chartId: string): Promise<void> {
    const res = await this.cidRepo.delete({ directoryId, chartId });
    if (!res.affected) {
      throw new NotFoundException("Chart is not in this directory");
    }
  }

  // ─── Sharing ────────────────────────────────────────────────────────────────

  async shareDirectory(
    directoryId: string,
    sharedWithUserId: string,
    sharedByUserId: string,
    permissions: { canEdit: boolean; canDelete: boolean; canShare: boolean },
    includeContent = false,
  ): Promise<void> {
    await this.assertDirectoryPermission(directoryId, sharedByUserId, "canShare");
    await this.shareDirRepo.upsert(
      { directoryId, sharedWithUserId, sharedByUserId, ...permissions },
      { conflictPaths: ["directoryId", "sharedWithUserId"], skipUpdateIfNoValuesChanged: false },
    );

    if (includeContent) {
      const charts = await this.cidRepo.find({ where: { directoryId }, select: ["chartId"] });
      for (const { chartId } of charts) {
        await this.chartShareRepo.upsert(
          { chartId, sharedWithUserId, sharedByUserId, ...permissions },
          { conflictPaths: ["chartId", "sharedWithUserId"], skipUpdateIfNoValuesChanged: false },
        );
      }
    }
  }

  async unshareDirectory(directoryId: string, sharedWithUserId: string): Promise<void> {
    await this.shareDirRepo.delete({ directoryId, sharedWithUserId });
  }

  async getDirectoryShares(directoryId: string): Promise<DirectoryShareEntity[]> {
    return this.shareDirRepo.find({ where: { directoryId } });
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  private async ensureNameUniqueAmongSiblings(
    name: string,
    parentId: string | null,
    excludeId?: string,
  ) {
    const qb = this.dirRepo
      .createQueryBuilder("d")
      .where("d.name = :name", { name })
      .andWhere("(d.parant_id::text IS NOT DISTINCT FROM :pid)", { pid: parentId });

    if (excludeId) qb.andWhere("d.id::text <> :excludeId", { excludeId });

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
