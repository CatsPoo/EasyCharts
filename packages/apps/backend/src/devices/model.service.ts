import { HttpException, HttpStatus, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { ModelEntity } from "./entities/model.entity";
import { VendorEntity } from "./entities/vendor.entity";
import type {
  Model,
  ModelCreate,
  ModelUpdate,
} from "@easy-charts/easycharts-types";
import { ListModelsQueryDto } from "../query/dto/query.dto";
import { AssetVersionsService } from "./assetVersions.service";

@Injectable()
export class ModelsService {
  constructor(
    @InjectRepository(ModelEntity)
    private readonly modelsRepo: Repository<ModelEntity>,
    @InjectRepository(VendorEntity)
    private readonly vendorRepo: Repository<VendorEntity>,
    private readonly assetVersionsService: AssetVersionsService,
    private readonly dataSource: DataSource,
  ) {}

  async createModel(dto: ModelCreate,createdByUserId:string): Promise<Model> {
    const model = this.modelsRepo.create({
      name: dto.name,
      createdByUserId
    });

    if (dto.vendorId) {
      const vendor = await this.vendorRepo.findOne({
        where: { id: dto.vendorId },
      });
      if (!vendor) throw new NotFoundException("Vendor not found");
      model.vendor = vendor;
    }

    const result = await this.modelsRepo.save(model);
    await this.assetVersionsService.saveVersion("models", result.id, result as unknown as object, createdByUserId);
    return result;
  }

  async updateModel(id: string, dto: ModelUpdate,updatedByUserId:string): Promise<Model> {
    const model: ModelEntity | null = await this.modelsRepo.findOne({
      where: { id },
      relations: ["vendor"],
    });
    if (!model) throw new NotFoundException("Model not found");

    if (dto.name) model.name = dto.name;

    if (dto.vendorId !== undefined) {
      const vendor = await this.vendorRepo.findOne({
        where: { id: dto.vendorId },
      });
      if (!vendor) throw new NotFoundException("Vendor not found");
      model.vendor = vendor;
    }

    const result = await this.modelsRepo.save({...model,updatedByUserId});
    await this.assetVersionsService.saveVersion("models", result.id, result as unknown as object, updatedByUserId);
    return result;
  }

  async listModels(q: ListModelsQueryDto):Promise<{rows:Model[],total:number}>{
    const take = q.pageSize ?? 25;
    const skip = (q.page ?? 0) * take;

    const qb = this.modelsRepo
      .createQueryBuilder("m")
      .leftJoinAndSelect("m.vendor", "v");

    if (q.search?.trim()) {
      qb.andWhere("LOWER(m.name) LIKE :s", {
        s: `%${q.search.toLowerCase()}%`,
      });
    }

    if (q.vendorId) {
      qb.andWhere("v.id = :vid", { vid: q.vendorId });
    }

    const allowed = new Set(["name", "createdAt", "updatedAt", "id"]);
    const sortBy = q.sortBy && allowed.has(q.sortBy) ? q.sortBy : "name";
    const sortDir = (q.sortDir ?? "asc").toUpperCase() as "ASC" | "DESC";
    qb.orderBy(`m.${sortBy}`, sortDir);

    const [rows, total] = await qb.skip(skip).take(take).getManyAndCount();
    return { rows, total };
  }

  async getModelById(id: string) : Promise<Model> {
    const found = await this.modelsRepo.findOne({ where: { id } });
    if (!found) throw new NotFoundException("Model not found");
    return found;
  }

  async removeModel(id: string):Promise<void> {
    const usedDevices = await this.dataSource.query<Array<{ id: string; name: string }>>(
      `SELECT id, name FROM devices WHERE model_id = $1`, [id]
    );
    if (usedDevices.length) {
      throw new HttpException(
        { message: 'Model is in use and cannot be deleted', usedIn: usedDevices.map(r => ({ ...r, kind: 'device' })) },
        HttpStatus.CONFLICT,
      );
    }
    await this.modelsRepo.delete(id);
  }
}
