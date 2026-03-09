import { HttpException, HttpStatus, Injectable, NotFoundException, OnApplicationBootstrap } from "@nestjs/common";
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
import { UsersService } from "../auth/user.service";

/** [vendorName, modelName] */
const DEFAULT_MODELS: [string, string][] = [
  // Cisco
  ['Cisco', 'Catalyst 9200'],
  ['Cisco', 'Catalyst 9300'],
  ['Cisco', 'Catalyst 9500'],
  ['Cisco', 'Nexus 9000'],
  ['Cisco', 'ISR 4321'],
  ['Cisco', 'ISR 4431'],
  ['Cisco', 'ASR 1001-X'],
  ['Cisco', 'ASA 5506-X'],
  ['Cisco', 'Firepower 2110'],
  ['Cisco', 'Firepower 4110'],
  ['Cisco', 'UCS C220 M6'],
  ['Cisco', 'Aironet 2802I'],
  // Checkpoint
  ['Checkpoint', 'Quantum 3200'],
  ['Checkpoint', 'Quantum 5800'],
  ['Checkpoint', 'Quantum 15400'],
  ['Checkpoint', 'Quantum 26000'],
  // Juniper
  ['Juniper', 'EX2300-48T'],
  ['Juniper', 'EX4300-48T'],
  ['Juniper', 'QFX5100'],
  ['Juniper', 'MX204'],
  ['Juniper', 'MX480'],
  ['Juniper', 'SRX300'],
  ['Juniper', 'SRX4100'],
  // HP
  ['HP', 'ProLiant DL360 Gen10'],
  ['HP', 'ProLiant DL380 Gen10'],
  ['HP', 'ProLiant DL560 Gen10'],
  ['HP', 'ProLiant ML350 Gen10'],
  // F5
  ['F5', 'BIG-IP 2000s'],
  ['F5', 'BIG-IP 4000s'],
  ['F5', 'BIG-IP i5800'],
  ['F5', 'BIG-IP i10800'],
  // Palo Alto
  ['Palo Alto', 'PA-220'],
  ['Palo Alto', 'PA-820'],
  ['Palo Alto', 'PA-3220'],
  ['Palo Alto', 'PA-5220'],
  ['Palo Alto', 'PA-7050'],
  // Fortinet
  ['Fortinet', 'FortiGate 60F'],
  ['Fortinet', 'FortiGate 100F'],
  ['Fortinet', 'FortiGate 400E'],
  ['Fortinet', 'FortiGate 600E'],
  ['Fortinet', 'FortiSwitch 124E'],
  ['Fortinet', 'FortiAP 231F'],
  // Arista
  ['Arista', 'DCS-7050CX3-32S'],
  ['Arista', 'DCS-7280SR2-48YC6'],
  ['Arista', 'DCS-7300X3-32C'],
  ['Arista', 'DCS-7500R'],
  // Dell
  ['Dell', 'PowerEdge R640'],
  ['Dell', 'PowerEdge R740'],
  ['Dell', 'PowerEdge R750'],
  ['Dell', 'PowerSwitch S5248F-ON'],
  ['Dell', 'PowerSwitch N3248TE-ON'],
  // Aruba
  ['Aruba', '2930F-48G'],
  ['Aruba', '6300M-48G'],
  ['Aruba', 'AP-515'],
  ['Aruba', 'AP-635'],
  // Ruckus
  ['Ruckus', 'ICX 7150-48P'],
  ['Ruckus', 'ICX 7550-48F'],
  ['Ruckus', 'R750'],
  ['Ruckus', 'R850'],
  // Extreme Networks
  ['Extreme Networks', 'X460-G2-48t'],
  ['Extreme Networks', 'X670-G2-48x'],
  ['Extreme Networks', 'X870-32c'],
  // Huawei
  ['Huawei', 'S5731S-H48T4XC'],
  ['Huawei', 'S6730-H48X6C'],
  ['Huawei', 'AR6140-16T4E2X'],
  ['Huawei', 'USG6350E'],
  ['Huawei', 'USG6650E'],
  // Netscout
  ['Netscout', 'nGENIUS 2400'],
  ['Netscout', 'nGENIUS 3900'],
  // VMware
  ['VMware', 'NSX-T'],
  ['VMware', 'vSphere 8'],
];

@Injectable()
export class ModelsService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(ModelEntity)
    private readonly modelsRepo: Repository<ModelEntity>,
    @InjectRepository(VendorEntity)
    private readonly vendorRepo: Repository<VendorEntity>,
    private readonly assetVersionsService: AssetVersionsService,
    private readonly dataSource: DataSource,
    private readonly usersService: UsersService,
  ) {}

  async onApplicationBootstrap() {
    const count = await this.modelsRepo.count();
    if (count !== 0) return;

    const users = await this.usersService.getAllUsers();
    const adminId = users[0]?.id ?? null;

    const vendorCache = new Map<string, VendorEntity>();

    for (const [vendorName, modelName] of DEFAULT_MODELS) {
      let vendor = vendorCache.get(vendorName);
      if (!vendor) {
        const found = await this.vendorRepo.findOne({ where: { name: vendorName } });
        if (!found) continue;
        vendorCache.set(vendorName, found);
        vendor = found;
      }
      const entity = this.modelsRepo.create({ name: modelName, vendor, createdByUserId: adminId });
      const saved = await this.modelsRepo.save(entity);
      if (adminId) {
        await this.assetVersionsService.saveVersion('models', saved.id, saved as unknown as object, adminId);
      }
    }
  }

  async createModel(dto: ModelCreate,createdByUserId:string): Promise<Model> {
    const model = this.modelsRepo.create({
      name: dto.name,
      iconUrl: dto.iconUrl,
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
    if (dto.iconUrl !== undefined) model.iconUrl = dto.iconUrl;

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
