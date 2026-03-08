import type { PortTypeCreate, PortTypeUpdate } from "@easy-charts/easycharts-types";
import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  OnApplicationBootstrap,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { PortTypeEntity } from "./entities/portType.entity";
import { UsersService } from "../auth/user.service";

const DEFAULT_PORT_TYPES = ["rj45", "sfp", "qsfp"];

@Injectable()
export class PortTypesService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(PortTypeEntity)
    private readonly portTypeRepo: Repository<PortTypeEntity>,
    private readonly dataSource: DataSource,
    private readonly usersService: UsersService,
  ) {}

  async onApplicationBootstrap() {
    const count = await this.portTypeRepo.count();
    if (count === 0) {
      const users = await this.usersService.getAllUsers();
      const adminId = users[0]?.id ?? null;
      await this.portTypeRepo.save(
        DEFAULT_PORT_TYPES.map((name) => this.portTypeRepo.create({ name, createdByUserId: adminId }))
      );
    }
  }

  async list(): Promise<PortTypeEntity[]> {
    return this.portTypeRepo.find({ order: { name: "ASC" } });
  }

  async getById(id: string): Promise<PortTypeEntity> {
    const found = await this.portTypeRepo.findOne({ where: { id } });
    if (!found) throw new NotFoundException(`Port type ${id} not found`);
    return found;
  }

  async create(dto: PortTypeCreate, createdByUserId: string): Promise<PortTypeEntity> {
    const entity = this.portTypeRepo.create({ ...dto, createdByUserId });
    return this.portTypeRepo.save(entity);
  }

  async update(id: string, dto: PortTypeUpdate, updatedByUserId: string): Promise<PortTypeEntity> {
    await this.getById(id);
    await this.portTypeRepo.update(id, { ...dto, updatedByUserId });
    return this.getById(id);
  }

  async remove(id: string): Promise<void> {
    await this.getById(id);
    const usedPorts = await this.dataSource.query<Array<{ id: string; name: string }>>(
      `SELECT id, name FROM ports WHERE type = (SELECT name FROM port_types WHERE id = $1)`,
      [id]
    );
    if (usedPorts.length) {
      throw new HttpException(
        {
          message: "Port type is in use and cannot be deleted",
          usedIn: usedPorts.map((r) => ({ ...r, kind: "port" })),
        },
        HttpStatus.CONFLICT
      );
    }
    await this.portTypeRepo.delete(id);
  }
}
