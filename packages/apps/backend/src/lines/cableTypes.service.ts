import type { CableTypeCreate, CableTypeUpdate } from "@easy-charts/easycharts-types";
import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, In, Repository } from "typeorm";
import { CableTypeEntity } from "./entities/cableType.entity";
import { PortTypeEntity } from "./entities/portType.entity";

type SeedEntry = { name: string; defaultColor: string; portTypeNames: string[] };

const DEFAULT_CABLE_TYPES: SeedEntry[] = [
  { name: "copper",      defaultColor: "#F97316", portTypeNames: ["rj45"]       },
  { name: "single_mode", defaultColor: "#EAB308", portTypeNames: ["sfp", "qsfp"] },
  { name: "multimode",   defaultColor: "#14B8A6", portTypeNames: ["sfp", "qsfp"] },
];

@Injectable()
export class CableTypesService implements OnModuleInit {
  constructor(
    @InjectRepository(CableTypeEntity)
    private readonly cableTypeRepo: Repository<CableTypeEntity>,
    @InjectRepository(PortTypeEntity)
    private readonly portTypeRepo: Repository<PortTypeEntity>,
    private readonly dataSource: DataSource
  ) {}

  async onModuleInit() {
    const count = await this.cableTypeRepo.count();
    if (count === 0) {
      for (const seed of DEFAULT_CABLE_TYPES) {
        const portTypes = await this.portTypeRepo.findBy({ name: In(seed.portTypeNames) });
        const entity = this.cableTypeRepo.create({
          name: seed.name,
          defaultColor: seed.defaultColor,
          compatiblePortTypes: portTypes,
          createdByUserId: "system",
        });
        await this.cableTypeRepo.save(entity);
      }
    }
  }

  async list(): Promise<CableTypeEntity[]> {
    return this.cableTypeRepo.find({
      relations: { compatiblePortTypes: true },
      order: { name: "ASC" },
    });
  }

  async getById(id: string): Promise<CableTypeEntity> {
    const found = await this.cableTypeRepo.findOne({
      where: { id },
      relations: { compatiblePortTypes: true },
    });
    if (!found) throw new NotFoundException(`Cable type ${id} not found`);
    return found;
  }

  async create(dto: CableTypeCreate, createdByUserId: string): Promise<CableTypeEntity> {
    const portTypes = dto.compatiblePortTypeIds?.length
      ? await this.portTypeRepo.findBy({ id: In(dto.compatiblePortTypeIds) })
      : [];
    const entity = this.cableTypeRepo.create({
      name: dto.name,
      defaultColor: dto.defaultColor,
      compatiblePortTypes: portTypes,
      createdByUserId,
    });
    return this.cableTypeRepo.save(entity);
  }

  async update(id: string, dto: CableTypeUpdate, updatedByUserId: string): Promise<CableTypeEntity> {
    const entity = await this.getById(id);
    if (dto.name !== undefined) entity.name = dto.name;
    if (dto.defaultColor !== undefined) entity.defaultColor = dto.defaultColor;
    if (dto.compatiblePortTypeIds !== undefined) {
      entity.compatiblePortTypes = dto.compatiblePortTypeIds.length
        ? await this.portTypeRepo.findBy({ id: In(dto.compatiblePortTypeIds) })
        : [];
    }
    entity.updatedByUserId = updatedByUserId;
    return this.cableTypeRepo.save(entity);
  }

  async remove(id: string): Promise<void> {
    await this.getById(id);
    const cableType = await this.cableTypeRepo.findOne({ where: { id }, select: ["id", "name"] });
    const usedLines = await this.dataSource.query<Array<{ id: string }>>(
      `SELECT id FROM lines WHERE cable_type = $1`,
      [cableType!.name]
    );
    if (usedLines.length) {
      throw new HttpException(
        {
          message: "Cable type is in use and cannot be deleted",
          usedIn: usedLines.map((r) => ({ id: r.id, name: r.id, kind: "line" })),
        },
        HttpStatus.CONFLICT
      );
    }
    await this.cableTypeRepo.delete(id);
  }
}
