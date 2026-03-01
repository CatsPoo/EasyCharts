import { type Chart, type ChartVersion, type ChartVersionMeta } from "@easy-charts/easycharts-types";
import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ChartVersionEntity } from "./entities/chartVersion.entity";

@Injectable()
export class ChartVersionsService {
  constructor(
    @InjectRepository(ChartVersionEntity)
    private readonly repo: Repository<ChartVersionEntity>,
  ) {}

  async saveVersion(
    chartId: string,
    snapshot: Chart,
    userId: string,
    label?: string,
  ): Promise<void> {
    const maxResult = await this.repo
      .createQueryBuilder("v")
      .select("MAX(v.versionNumber)", "max")
      .where("v.chartId = :chartId", { chartId })
      .getRawOne<{ max: number | null }>();

    const nextVersion = (maxResult?.max ?? 0) + 1;

    await this.repo.insert({
      chartId,
      versionNumber: nextVersion,
      snapshot: snapshot as unknown as object,
      label: label ?? null,
      savedByUserId: userId,
    });
  }

  async listVersions(chartId: string): Promise<ChartVersionMeta[]> {
    const rows = await this.repo.find({
      where: { chartId },
      order: { versionNumber: "DESC" },
      relations: { savedByUser: true },
    });

    return rows.map((r) => ({
      id: r.id,
      chartId: r.chartId,
      versionNumber: r.versionNumber,
      label: r.label,
      savedAt: r.savedAt,
      savedByUserId: r.savedByUserId,
      savedByUsername: r.savedByUser?.username ?? null,
    }));
  }

  async getVersion(chartId: string, versionId: string): Promise<ChartVersion> {
    const row = await this.repo.findOne({
      where: { id: versionId, chartId },
      relations: { savedByUser: true },
    });
    if (!row) throw new NotFoundException(`Chart version ${versionId} not found`);

    return {
      id: row.id,
      chartId: row.chartId,
      versionNumber: row.versionNumber,
      label: row.label,
      savedAt: row.savedAt,
      savedByUserId: row.savedByUserId,
      savedByUsername: row.savedByUser?.username ?? null,
      snapshot: row.snapshot,
    };
  }
}
