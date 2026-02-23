import {
  BadGatewayException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { LineEntity } from "./entities/line.entity";
import {
  Bond,
  BondCreate,
  BondUpdate,
  Line,
  Port,
} from "@easy-charts/easycharts-types";
import { InjectRepository } from "@nestjs/typeorm";
import { EntityManager, In, IsNull, Not, Repository } from "typeorm";
import { LineOnChartEntity } from "../charts/entities/lineonChart.emtity";
import { BondEntity } from "./entities/bond.entity";
import { PortEntity } from "../devices/entities/port.entity";

export interface BondPortSiblingsResult {
  bondId: string;
  bondName: string;
  sameSide: Port[];
  otherSide: { deviceId: string; ports: Port[] }[];
  /** Existing DB line IDs for each port pair in this bond, keyed as "portA_id:portB_id" in both directions */
  memberLinePairs: { lineId: string; sourcePortId: string; targetPortId: string }[];
}

@Injectable()
export class LinessService {
  constructor(
    @InjectRepository(LineEntity)
    private readonly linesrepo: Repository<LineEntity>,
    @InjectRepository(BondEntity)
    private readonly bondRepo: Repository<BondEntity>
  ) {}
  convertLineEntity(lineEntity: LineEntity): Line {
    return {
      ...lineEntity
    } as Line;
  }

  convertLineToEntity(line: Line): LineEntity {
    const { id, sourcePort, targetPort } = line;
    return {
      id,
      sourcePort,
      sourcePortId: sourcePort.id,
      targetPortId: targetPort.id,
      targetPort,
    } as LineEntity;
  }

  async getConnectedPortIdMap(portIds: string[]): Promise<Map<string, string>> {
    if (!portIds.length) return new Map();
    const lines = await this.linesrepo.find({
      where: [{ sourcePortId: In(portIds) }, { targetPortId: In(portIds) }],
      select: ["sourcePortId", "targetPortId"],
    });
    const map = new Map<string, string>();
    for (const line of lines) {
      if (line.sourcePortId && portIds.includes(line.sourcePortId))
        map.set(line.sourcePortId, line.targetPortId);
      if (line.targetPortId && portIds.includes(line.targetPortId))
        map.set(line.targetPortId, line.sourcePortId);
    }
    return map;
  }

  private portEntityToPort(p: PortEntity): Port {
    return {
      id: p.id,
      name: p.name,
      deviceId: p.deviceId,
      type: p.type,
      inUse: p.inUse,
      createdAt: p.createdAt,
      createdByUserId: p.createdByUserId,
      updatedAt: p.updatedAt,
      updatedByUserId: p.updatedByUserId,
    };
  }

  async getBondPortSiblings(
    portId: string,
    deviceId: string,
  ): Promise<BondPortSiblingsResult | null> {
    const line = await this.linesrepo.findOne({
      where: [
        { sourcePortId: portId, bondId: Not(IsNull()) },
        { targetPortId: portId, bondId: Not(IsNull()) },
      ],
      select: ['id', 'bondId'],
    });
    if (!line?.bondId) return null;

    const bond = await this.bondRepo.findOne({
      where: { id: line.bondId },
      relations: {
        members: {
          sourcePort: true,
          targetPort: true,
        },
      },
    });
    if (!bond) return null;

    const sameSideIds = new Set<string>();
    const sameSide: Port[] = [];
    const otherSidePortIds = new Map<string, Set<string>>();
    const otherSideMap = new Map<string, Port[]>();

    for (const member of bond.members ?? []) {
      if (!member.sourcePort || !member.targetPort) continue;

      // Each port's connectedPortId is the ID of the port at the other end of this line
      const portsWithCounterpart: [PortEntity, string][] = [
        [member.sourcePort, member.targetPortId],
        [member.targetPort, member.sourcePortId],
      ];

      for (const [port, connectedPortId] of portsWithCounterpart) {
        if (port.id === portId) continue;

        if (port.deviceId === deviceId) {
          if (sameSideIds.has(port.id)) continue;
          sameSideIds.add(port.id);
          sameSide.push({ ...this.portEntityToPort(port), connectedPortId });
        } else {
          const seenIds = otherSidePortIds.get(port.deviceId) ?? new Set<string>();
          if (seenIds.has(port.id)) continue;
          seenIds.add(port.id);
          otherSidePortIds.set(port.deviceId, seenIds);
          const list = otherSideMap.get(port.deviceId) ?? [];
          list.push({ ...this.portEntityToPort(port), connectedPortId });
          otherSideMap.set(port.deviceId, list);
        }
      }
    }

    if (sameSide.length === 0 && otherSideMap.size === 0) return null;

    const memberLinePairs = (bond.members ?? [])
      .filter((m) => m.sourcePort && m.targetPort)
      .map((m) => ({ lineId: m.id, sourcePortId: m.sourcePortId, targetPortId: m.targetPortId }));

    return {
      bondId: bond.id,
      bondName: bond.name,
      sameSide,
      otherSide: Array.from(otherSideMap.entries()).map(([dId, ports]) => ({
        deviceId: dId,
        ports,
      })),
      memberLinePairs,
    };
  }

  async getConnectedPortInfo(portId: string): Promise<Port | null> {
    const line = await this.linesrepo.findOne({
      where: [{ sourcePortId: portId }, { targetPortId: portId }],
      relations: { sourcePort: true, targetPort: true },
    });
    if (!line) return null;
    const otherPort =
      line.sourcePortId === portId ? line.targetPort : line.sourcePort;
    if (!otherPort) return null;
    return this.portEntityToPort(otherPort);
  }

  async deleteOrphanLines(manager?: EntityManager): Promise<number> {
    const man = manager ?? this.linesrepo.manager;
    return man.transaction(async (m) => {
      const usedLinesSub = m
        .createQueryBuilder()
        .subQuery()
        .select("loc.lineId")
        .from(LineOnChartEntity, "loc")
        .getQuery(); // -> (SELECT loc.lineId FROM lines_on_chart loc)

      const res = await m
        .createQueryBuilder()
        .delete()
        .from(LineEntity)
        .where(`id NOT IN ${usedLinesSub}`)
        .execute();

      return res.affected ?? 0;
    });
  }

  convertBondEntitytoBond(bondEntity: BondEntity): Bond {
  const members = Array.isArray(bondEntity.members) ? bondEntity.members : [];
  const memberIds = members
    .filter((m): m is LineEntity => !!m && (m as any).id)   // drop nulls
    .map(m => m.id);

  return {
    membersLines: memberIds,
    ...bondEntity
  } as Bond;
}

  async createEmptyBond(bondCreate: BondCreate,createdByUserId:string): Promise<Bond> {
    const newBond: BondEntity = await this.bondRepo.save({
      id: bondCreate.id,
      name: bondCreate.name,
      created_by_user_id:createdByUserId
    });

    return this.convertBondEntitytoBond(newBond);
  }

  async getBondById(id: string): Promise<Bond | null> {
    const bond: BondEntity | null = await this.bondRepo.findOne({
      where: { id },
      relations: { members: true },
    });
    if (!bond) return null;
    return this.convertBondEntitytoBond(bond);
  }

  async updateBond(id: string, bondUpdate: BondUpdate,updatedByUserId:string): Promise<Bond> {
    const bond = await this.bondRepo.findOne({
      where: { id },
      relations: { members: true },
    });
    if (!bond) throw new NotFoundException(`Bond ${id} not found`);

    bond.updatedByUserId=updatedByUserId
    
    if (bondUpdate.name) {
      bond.name = bondUpdate.name;
      await this.bondRepo.save(bond);
    }

    if (bondUpdate.membersLines) {
      const requestedIds = bondUpdate.membersLines;
      const requestedLines = requestedIds.length
        ? await this.linesrepo.findBy({ id: In(requestedIds) })
        : [];

      if (requestedLines.length !== requestedIds.length) {
        throw new BadGatewayException(
          `One or more requested members of bond ${id} don't exist`
        );
      }

      // (policy) Forbid stealing from other bonds; comment out to allow reassignment
      const foreign = requestedLines.filter((l) => l.bondId && l.bondId !== id);
      if (foreign.length) {
        const ids = foreign.map((f) => f.id).join(", ");
        throw new BadGatewayException(
          `Line(s) ${ids} already member of bond ${foreign[0].bondId}`
        );
      }

      // Current members
      const currentLines = await this.linesrepo.findBy({ bondId: id });
      const currentIds = new Set(currentLines.map((l) => l.id));
      const requestedSet = new Set(requestedIds);

      const toAdd = requestedLines.filter((l) => !currentIds.has(l.id));
      const toRemove = currentLines.filter((l) => !requestedSet.has(l.id));

      if (toRemove.length) {
        await this.linesrepo
          .createQueryBuilder()
          .update(LineEntity)
          .set({ bondId: null })
          .where("id IN (:...ids)", { ids: toRemove.map((l) => l.id) })
          .execute();
      }
      if (toAdd.length) {
        await this.linesrepo
          .createQueryBuilder()
          .update(LineEntity)
          .set({ bondId: id })
          .where("id IN (:...ids)", { ids: toAdd.map((l) => l.id) })
          .execute();
      }
    }

    // Return fresh
    const reloaded = await this.bondRepo.findOne({
      where: { id },
      relations: { members: true },
    });
    if (!reloaded)
      throw new InternalServerErrorException(`Cannot reload bond ${id}`);
    return this.convertBondEntitytoBond(reloaded);
  }

  async deleteBond(id: string): Promise<void> {
    this.bondRepo.delete(id);
  }

  async upsertLines(manager: EntityManager, lines: Line[], userId: string): Promise<Line[]> {
    if (!lines?.length) return [];
    const repo = manager.getRepository(LineEntity);

    // If the frontend generated a fresh UUID for a port pair that already exists in the
    // DB (e.g. line shared with another chart), the upsert ON CONFLICT (id) would miss
    // and then fail on UNIQUE(source_port_id, target_port_id).
    // Fix: look up existing lines for these port pairs and reuse their IDs.
    const portIds = [...new Set(lines.flatMap((l) => [l.sourcePort.id, l.targetPort.id]))];
    const existingLines = await repo.find({
      where: [{ sourcePortId: In(portIds) }, { targetPortId: In(portIds) }],
      select: ['id', 'sourcePortId', 'targetPortId'],
    });
    const existingIdByPair = new Map<string, string>();
    for (const el of existingLines) {
      existingIdByPair.set(`${el.sourcePortId}:${el.targetPortId}`, el.id);
    }
    const normalizedLines = lines.map((l) => {
      const existingId = existingIdByPair.get(`${l.sourcePort.id}:${l.targetPort.id}`);
      return existingId ? { ...l, id: existingId } : l;
    });

    await repo.upsert(
      normalizedLines.map((l) => ({ ...this.convertLineToEntity(l), createdByUserId: userId, updatedByUserId: userId })),
      { conflictPaths: ['id'], skipUpdateIfNoValuesChanged: true }
    );

    return normalizedLines;
  }

  // 2) Ensure BondEntity exists and update membership (global only)

  async ensureAndUpdateBonds(manager: EntityManager, bonds: Bond[],userId:string): Promise<void> {
    if (!bonds || bonds.length === 0) return;

    const bondRepo = manager.getRepository(BondEntity);
    const lineRepo = manager.getRepository(LineEntity);

    for (const b of bonds) {
      const bondId = b.id;
      const requestedIds = b.membersLines ?? [];

      // 1) Ensure bond exists (name update if provided)
      let bond = await bondRepo.findOne({ where: { id: bondId } });
      if (!bond) {
        bond = await bondRepo.save({ id: bondId, name: b.name,createdByUserId:userId } as Partial<BondEntity>);
      } else if (b.name && b.name !== bond.name) {
        bond.name = b.name;
        bond.updatedByUserId = userId
        await bondRepo.save(bond);
      }

      // 2) Validate requested lines exist
      const requestedLines = requestedIds.length
        ? await lineRepo.findBy({ id: In(requestedIds) })
        : [];
      if (requestedLines.length !== requestedIds.length) {
        throw new BadGatewayException(
          `One or more requested members of bond ${bondId} don't exist`
        );
      }

      // 3) Load current membership (all lines currently pointing to this bond)
      const currentLines = await lineRepo.findBy({ bondId });
      const currentIds = new Set(currentLines.map((l) => l.id));
      const requestedSet = new Set(requestedIds);

      // 4) Compute deltas
      const toAdd = requestedLines.filter((l) => !currentIds.has(l.id));
      const toRemove = currentLines.filter((l) => !requestedSet.has(l.id));

      // (Optional policy) If you want to forbid stealing a line from another bond:
      // - Check lines in requestedLines whose bondId is not null and not this bondId,
      //   and throw. Otherwise, remove this guard to allow reassignment.
      const foreign = requestedLines.filter(
        (l) => l.bondId && l.bondId !== bondId
      );
      if (foreign.length) {
        const ids = foreign.map((f) => f.id).join(", ");
        throw new BadGatewayException(
          `Line(s) ${ids} already member of bond ${foreign[0].bondId}`
        );
      }

      // 5) Persist membership via the OWNER side (LineEntity.bondId)

      // 5a) Clear removed members
      if (toRemove.length) {
        await lineRepo
          .createQueryBuilder()
          .update(LineEntity)
          .set({ bondId: null })
          .where("id IN (:...ids)", { ids: toRemove.map((l) => l.id) })
          .execute();
      }

      // 5b) Add new members
      if (toAdd.length) {
        await lineRepo
          .createQueryBuilder()
          .update(LineEntity)
          .set({ bondId })
          .where("id IN (:...ids)", { ids: toAdd.map((l) => l.id) })
          .execute();
      }
    }
  }
}
