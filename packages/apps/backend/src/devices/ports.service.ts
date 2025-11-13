import type {
  Port,
  PortCreate,
  PortType,
  PortUpdate,
} from "@easy-charts/easycharts-types";
import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, EntityManager, In, Repository } from "typeorm";
import { LineEntity } from "../lines/entities/line.entity";
import { QueryDto } from "../query/dto/query.dto";
import { PortEntity } from "./entities/port.entity";
import { updatePortPayload } from "./interfaces/ports.interfaces";

@Injectable()
export class PortsService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(PortEntity)
    private readonly portsRepo: Repository<PortEntity>
  ) {}

  async createPort(dto: PortCreate,createdByUserId:string): Promise<Port> {
    const entity = this.portsRepo.create({
      ...dto,
      type: dto.type as PortType,
      createdByUserId
    });
    return this.portsRepo.save(entity);
  }

  async upsertPorts(ports: Partial<PortEntity>[], manager?: EntityManager) {
    const portRepo = manager
      ? manager.getRepository(PortEntity)
      : this.portsRepo;
    await portRepo.upsert(ports, {
      conflictPaths: ["id"],
      skipUpdateIfNoValuesChanged: true,
    });
  }

  async listPorts(q: QueryDto): Promise<{ rows: Port[]; total: number }> {
    const take = q.pageSize ?? 25;
    const skip = (q.page ?? 0) * take;

    const qb = this.portsRepo.createQueryBuilder("v");

    if (q.search?.trim()) {
      qb.where("LOWER(v.name) LIKE :s", { s: `%${q.search.toLowerCase()}%` });
    }

    const allowed = new Set(["name", "id", "createdAt", "updatedAt"]);
    const sortBy = q.sortBy && allowed.has(q.sortBy) ? q.sortBy : "name";
    const sortDir = (q.sortDir ?? "asc").toUpperCase() as "ASC" | "DESC";

    qb.orderBy(`v.${sortBy}`, sortDir);

    const [rows, total] = await qb.skip(skip).take(take).getManyAndCount();
    return { rows, total };
  }

  async getPortrById(id: string): Promise<Port> {
    const found = await this.portsRepo.findOne({ where: { id } });
    if (!found) throw new NotFoundException("Port not found");
    return found;
  }

  async updatePort(id: string, dto: PortUpdate,updatedByUserId:string): Promise<Port> {
    await this.portsRepo.update(id, { ...dto, type: dto.type as PortType ,updatedByUserId});
    return this.getPortrById(id);
  }

  async removePort(id: string): Promise<void> {
    await this.portsRepo.delete(id);
  }

  async getPortsInUse(): Promise<Port[]> {
    return await this.dataSource
      .getRepository(PortEntity)
      .createQueryBuilder("p")
      .where((qb) => {
        const sub = qb
          .subQuery()
          .select("1")
          .from(LineEntity, "l")
          .where("l.sourcePortId = p.id OR l.targetPortId = p.id")
          .andWhere("")
          .getQuery();
        return `EXISTS ${sub}`;
      })
      .distinct(true)
      .getMany();
  }

  async recomputePortsInUse(): Promise<void> {
    await this.dataSource.transaction(async (m) => {
      const portRepo = m.getRepository(PortEntity);
      const qb = portRepo.createQueryBuilder();

      const usedAsSource = qb
        .subQuery()
        .select("l.source_port_id")
        .from(LineEntity, "l")
        .getQuery();

      const usedAsTarget = qb
        .subQuery()
        .select("l2.target_port_id")
        .from(LineEntity, "l2")
        .getQuery();

      // 1) set all to false
      await portRepo
        .createQueryBuilder()
        .update(PortEntity)
        .set({ inUse: false })
        .execute();

      // 2) set used ones to true
      await portRepo
        .createQueryBuilder()
        .update(PortEntity)
        .set({ inUse: true })
        .where(`id IN ${usedAsSource} OR id IN ${usedAsTarget}`)
        .execute();
    });
  }

  convertPortEntityToPort(portEntity: PortEntity): Port {
    return {...portEntity}
  }

  async getPortsByIds(ids: string[], manager?: EntityManager) {
    const portRepo = manager
      ? manager.getRepository(PortEntity)
      : this.portsRepo;
    return portRepo.find({
      where: { id: In(ids) },
      select: ["id", "deviceId"],
    });
  }

  async upsertPortsForDevice(
    deviceId: string,
    ports:
      | updatePortPayload[]
      | undefined
      | null,
    updatedBuUserid:string,
    manager?: EntityManager
  ): Promise<void> {
    if (!ports?.length) return;

    const portRepo = manager
      ? manager.getRepository(PortEntity)
      : this.portsRepo;

    // Prevent moving an existing port id to another device
    const ids = [...new Set(ports.map((p) => p.id))];
    const existing = await portRepo.find({
      where: { id: In(ids) },
      select: ["id", "deviceId"],
    });
    const byId = new Map(existing.map((e) => [e.id, e.deviceId]));
    const conflicts = ports.filter(
      (p) => byId.has(p.id) && byId.get(p.id) !== deviceId
    );
    if (conflicts.length) {
      throw new BadRequestException(
        `Port(s) belong to a different device: ${conflicts
          .map((c) => c.id)
          .join(", ")}`
      );
    }

    // Upsert and force-bind to device
    await portRepo.upsert(
      ports.map((p) => ({
        id: p.id,
        name: p.name,
        type: p.type as any,
        deviceId,
        updatedBuUserid,
        createdByUserId:p.createdByUserId ?? updatedBuUserid
      })),
      { conflictPaths: ["id"], skipUpdateIfNoValuesChanged: true }
    );
  }
}
