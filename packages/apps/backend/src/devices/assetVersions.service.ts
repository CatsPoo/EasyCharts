import { type AssetVersion, type AssetVersionMeta } from "@easy-charts/easycharts-types";
import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AssetVersionEntity } from "./entities/assetVersion.entity";

@Injectable()
export class AssetVersionsService {
  constructor(
    @InjectRepository(AssetVersionEntity)
    private readonly repo: Repository<AssetVersionEntity>,
  ) {}

  async saveVersion(
    assetKind: string,
    assetId: string,
    snapshot: object,
    userId: string,
  ): Promise<void> {
    const maxResult = await this.repo
      .createQueryBuilder("v")
      .select("MAX(v.versionNumber)", "max")
      .where("v.assetId = :assetId AND v.assetKind = :assetKind", { assetId, assetKind })
      .getRawOne<{ max: number | null }>();

    const nextVersion = (maxResult?.max ?? 0) + 1;

    await this.repo.insert({
      assetId,
      assetKind,
      versionNumber: nextVersion,
      snapshot,
      savedByUserId: userId,
    });
  }

  async listVersions(assetKind: string, assetId: string): Promise<AssetVersionMeta[]> {
    const rows = await this.repo.find({
      where: { assetId, assetKind },
      order: { versionNumber: "DESC" },
      relations: { savedByUser: true },
    });

    return rows.map((r) => ({
      id: r.id,
      assetId: r.assetId,
      assetKind: r.assetKind as AssetVersionMeta["assetKind"],
      versionNumber: r.versionNumber,
      savedAt: r.savedAt,
      savedByUserId: r.savedByUserId,
      savedByUsername: r.savedByUser?.username ?? null,
    }));
  }

  async getVersion(assetKind: string, assetId: string, versionId: string): Promise<AssetVersion> {
    const row = await this.repo.findOne({
      where: { id: versionId, assetId, assetKind },
      relations: { savedByUser: true },
    });
    if (!row) throw new NotFoundException(`Asset version ${versionId} not found`);

    return {
      id: row.id,
      assetId: row.assetId,
      assetKind: row.assetKind as AssetVersion["assetKind"],
      versionNumber: row.versionNumber,
      savedAt: row.savedAt,
      savedByUserId: row.savedByUserId,
      savedByUsername: row.savedByUser?.username ?? null,
      snapshot: row.snapshot,
    };
  }
}
