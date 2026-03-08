// src/charts/charts.service.ts
import {
  BondOnChart,
  ChartLock,
  LineOnChart,
  type Chart,
  type ChartCreate,
  type ChartMetadata,
  type ChartUpdate,
  type CloudOnChart,
  type CustomElementOnChart,
  type DeviceOnChart,
  type ZoneOnChart
} from "@easy-charts/easycharts-types";
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, EntityManager, In, Repository } from "typeorm";
import { ChartInDirectoryEntity } from "../chartsDirectories/entities/chartsInDirectory.entity";
import { DirectoryShareEntity } from "../chartsDirectories/entities/directoryShare.entity";
import { DeviceEntity } from "../devices/entities/device.entity";
import { PortEntity } from "../devices/entities/port.entity";
import { PortsService } from "../devices/ports.service";
import { LineEntity } from "../lines/entities/line.entity";
import { LinessService } from "../lines/lines.service";
import { BondsOnChartService } from "./bondOnChart.service";
import { ChartLockFeilds } from "./chartLockes.types";
import { ChartVersionsService } from "./chartVersions.service";
import { CloudsOnChartService } from "./cloudOnChart.service";
import { DevicesOnChartService } from "./deviceOnChart.service";
import { ChartEntity } from "./entities/chart.entity";
import { ChartShareEntity } from "./entities/chartShare.entity";
import { ChartIsLockedExeption } from "./exeptions/chartIsLocked.exeption";
import { ChartNotFoundExeption } from "./exeptions/chartNotFound.exeption";
import { LinesOnChartService } from "./lineOnChart.service";
import { NotesOnChartService } from "./noteOnChart.service";
import { ZonesOnChartService } from "./zoneOnChart.service";
import { CustomElementsOnChartService } from "./customElementOnChart.service";

@Injectable()
export class ChartsService {
  constructor(
    private readonly dataSource: DataSource,

    @InjectRepository(ChartEntity)
    private readonly chartRepo: Repository<ChartEntity>,

    @InjectRepository(ChartShareEntity)
    private readonly chartShareRepo: Repository<ChartShareEntity>,

    @InjectRepository(ChartInDirectoryEntity)
    private readonly cidRepo: Repository<ChartInDirectoryEntity>,

    @InjectRepository(DirectoryShareEntity)
    private readonly shareDirRepo: Repository<DirectoryShareEntity>,

    // Global services (no knowledge of *OnChart)
    private readonly linesService: LinessService,
    private readonly portsService: PortsService,

    // Instance-level services (only *OnChart)
    private readonly devicesOnChartService: DevicesOnChartService,
    private readonly linesOnChartService: LinesOnChartService,
    private readonly bondsOnChartService: BondsOnChartService,
    private readonly notesOnChartService: NotesOnChartService,
    private readonly zonesOnChartService: ZonesOnChartService,
    private readonly cloudsOnChartService: CloudsOnChartService,
    private readonly customElementsOnChartService: CustomElementsOnChartService,
    private readonly chartVersionsService: ChartVersionsService,
  ) {}

  getLockFromChartEntity = (chartEntiy: ChartLockFeilds): ChartLock => {
    return {
      chartId: chartEntiy.id,
      lockedAt: chartEntiy.lockedAt ?? null,
      lockedById: chartEntiy.lockedById ?? null,
      lockedByName: chartEntiy.lockedBy ? chartEntiy.lockedBy.username : "",
    } as ChartLock;
  };

  private async enrichPortsWithConnectedPortIds(chart: Chart): Promise<Chart> {
    const portIds = chart.devicesOnChart.flatMap((doc) =>
      doc.device.ports.map((p) => p.id)
    );
    const connectedMap = await this.linesService.getConnectedPortIdMap(portIds);
    if (!connectedMap.size) return chart;
    return {
      ...chart,
      devicesOnChart: chart.devicesOnChart.map((doc) => ({
        ...doc,
        device: {
          ...doc.device,
          ports: doc.device.ports.map((p) =>
            connectedMap.has(p.id)
              ? { ...p, connectedPortId: connectedMap.get(p.id) }
              : p
          ),
        },
      })),
    } as Chart;
  }

  convertChartEntityToChart = async (
    chartEnrity: ChartEntity
  ): Promise<Chart> => {
    const { devicesOnChart, linesOnChart, bondOnChart, notesOnChart, zonesOnChart, cloudsOnChart, customElementsOnChart, customElementEdgesOnChart, createdAt, createdByUserId, updatedAt, updatedByUserId, ...chartData } = chartEnrity;
    const convertedDeviceOnCharts: DeviceOnChart[] = [];
    for (const dl of devicesOnChart) convertedDeviceOnCharts.push(await this.devicesOnChartService.convertDeviceOnChartEntity(dl));

    const convertedLinesOnChart: LineOnChart[] = [];
    for (const ll of linesOnChart ?? []) convertedLinesOnChart.push(await this.linesOnChartService.convertLineonChartEntity(ll));

    const convertedBondOnChart: BondOnChart[] = [];
    for (const b of bondOnChart ?? []) convertedBondOnChart.push(this.bondsOnChartService.convertBondOnChartEntity(b));

    const convertedNotesOnChart = (notesOnChart ?? []).map((n) =>
      this.notesOnChartService.convertNoteOnChartEntity(n)
    );

    const convertedZonesOnChart: ZoneOnChart[] = (zonesOnChart ?? []).map((z) =>
      this.zonesOnChartService.convertZoneOnChartEntity(z)
    );

    const convertedCloudsOnChart: CloudOnChart[] = (cloudsOnChart ?? []).map((c) =>
      this.cloudsOnChartService.convertCloudOnChartEntity(c)
    );

    const convertedCustomElementsOnChart: CustomElementOnChart[] = (customElementsOnChart ?? []).map((ce) =>
      this.customElementsOnChartService.convertEntity(ce)
    );

    const convertedCustomElementEdgesOnChart = (customElementEdgesOnChart ?? []).map((e) => ({
      id: e.id,
      sourceNodeId: e.sourceNodeId,
      sourceHandle: e.sourceHandle,
      targetNodeId: e.targetNodeId,
      targetHandle: e.targetHandle,
      sourcePortId: e.sourcePortId ?? undefined,
      targetPortId: e.targetPortId ?? undefined,
    }));

    return {
      devicesOnChart: convertedDeviceOnCharts,
      linesOnChart: convertedLinesOnChart,
      bondsOnChart: convertedBondOnChart,
      notesOnChart: convertedNotesOnChart,
      zonesOnChart: convertedZonesOnChart,
      cloudsOnChart: convertedCloudsOnChart,
      customElementsOnChart: convertedCustomElementsOnChart,
      customElementEdgesOnChart: convertedCustomElementEdgesOnChart,
      lock: this.getLockFromChartEntity(chartEnrity),
      createdAt,
      createdByUserId,
      updatedAt,
      updatedByUserId,
      ...chartData,
    } as Chart;
  };

  // ---------- reads/creates unchanged ----------
  async getAllCharts(): Promise<Chart[]> {
    const convertedCharts: Chart[] = [];
    const charts = await this.chartRepo.find({});
    for (const c of charts) convertedCharts.push(await this.convertChartEntityToChart(c));
    return convertedCharts;
  }

  async getChartById(id: string): Promise<Chart> {
    const chart: ChartEntity | null = await this.chartRepo.findOne({
      where: { id },
      relations: {
        devicesOnChart: {
          device: { model: { vendor: true }, ports: true },
          portPlacements: { port: true },
          position: true,
        },
        linesOnChart: { line: { sourcePort: true, targetPort: true } },
        bondOnChart: { bond: { members: true } },
        notesOnChart: true,
        zonesOnChart: true,
        cloudsOnChart: { cloud: true, connections: true },
        customElementsOnChart: { customElement: true },
        customElementEdgesOnChart: true,
      },
    });
    if (!chart) throw new NotFoundException("chart not found");
    const converted = await this.convertChartEntityToChart(chart);
    return this.enrichPortsWithConnectedPortIds(converted);
  }

  async createChart(dto: ChartCreate,createdByUserId:string): Promise<Chart> {
    const chart: ChartEntity = this.chartRepo.create({
      name: dto.name,
      description: dto.description,
      createdByUserId,
      devicesOnChart: dto.devicesOnChart.map((dl) => ({
        deviceId: dl.device.id,
        position: dl.position,
      })),
      bondOnChart: [],
    });
    const newChart: ChartEntity = await this.chartRepo.save(chart);
    const result = await this.convertChartEntityToChart(newChart);
    await this.chartVersionsService.saveVersion(result.id, result, createdByUserId);
    return result;
  }

  convertChartToChartMetadata(
    chartEntity: ChartEntity,
    myPrivileges?: { canEdit: boolean; canDelete: boolean; canShare: boolean },
  ): ChartMetadata {
    const { createdAt, createdByUserId, description, id, name } = chartEntity;
    return {
      createdAt,
      createdByUserId,
      description,
      id,
      name,
      lock: this.getLockFromChartEntity(chartEntity),
      ...(myPrivileges !== undefined ? { myPrivileges } : {}),
    } as ChartMetadata;
  }

  private computePrivileges(
    chart: ChartEntity,
    userId: string,
    shareMap: Map<string, ChartShareEntity>,
  ): { canEdit: boolean; canDelete: boolean; canShare: boolean } {
    if (chart.createdByUserId === userId) {
      return { canEdit: true, canDelete: true, canShare: true };
    }
    const share = shareMap.get(chart.id);
    return {
      canEdit: share?.canEdit ?? false,
      canDelete: share?.canDelete ?? false,
      canShare: share?.canShare ?? false,
    };
  }

  private async buildShareMap(
    chartIds: string[],
    userId: string,
  ): Promise<Map<string, ChartShareEntity>> {
    if (chartIds.length === 0) return new Map();
    const shares = await this.chartShareRepo.find({
      where: { chartId: In(chartIds), sharedWithUserId: userId },
    });
    return new Map(shares.map(s => [s.chartId, s]));
  }

  async buildChartMetadataWithPrivileges(
    charts: ChartEntity[],
    userId: string,
  ): Promise<ChartMetadata[]> {
    const shareMap = await this.buildShareMap(charts.map(c => c.id), userId);
    return charts.map(c =>
      this.convertChartToChartMetadata(c, this.computePrivileges(c, userId, shareMap)),
    );
  }

  async getAllUserChartsMetadata(userId: string): Promise<ChartMetadata[]> {
    const charts = await this.chartRepo
      .createQueryBuilder("c")
      .leftJoin(ChartShareEntity, "cs", "cs.chart_id::text = c.id::text AND cs.shared_with_user_id::text = :userId", { userId })
      .where("c.created_by_user_id::text = :userId OR cs.shared_with_user_id IS NOT NULL", { userId })
      .getMany();
    return this.buildChartMetadataWithPrivileges(charts, userId);
  }

  async getUnassignedChartsMetadata(userId: string): Promise<ChartMetadata[]> {
    const charts = await this.chartRepo
      .createQueryBuilder("c")
      .leftJoin(ChartShareEntity, "cs", "cs.chart_id::text = c.id::text AND cs.shared_with_user_id::text = :userId", { userId })
      .leftJoin("charts_in_directories", "cid", "cid.chart_id = c.id::text")
      .where("(c.created_by_user_id::text = :userId OR cs.shared_with_user_id IS NOT NULL)", { userId })
      .andWhere("cid.chart_id IS NULL")
      .getMany();
    return this.buildChartMetadataWithPrivileges(charts, userId);
  }

  async shareChart(
    chartId: string,
    sharedWithUserId: string,
    sharedByUserId: string,
    permissions: { canEdit: boolean; canDelete: boolean; canShare: boolean },
  ): Promise<void> {
    // Sharer can only grant privileges they themselves hold (owners have all)
    const chart = await this.chartRepo.findOne({ where: { id: chartId }, select: { id: true, createdByUserId: true } });
    if (!chart) throw new NotFoundException(`Chart ${chartId} not found`);
    if (sharedWithUserId === chart.createdByUserId)
      throw new ForbiddenException("Cannot share a chart with its creator");
    if (chart.createdByUserId !== sharedByUserId) {
      const sharerShare = await this.chartShareRepo.findOne({ where: { chartId, sharedWithUserId: sharedByUserId } });
      if (permissions.canEdit   && !sharerShare?.canEdit)   throw new ForbiddenException("You cannot grant edit permission you do not have");
      if (permissions.canDelete && !sharerShare?.canDelete) throw new ForbiddenException("You cannot grant delete permission you do not have");
      if (permissions.canShare  && !sharerShare?.canShare)  throw new ForbiddenException("You cannot grant share permission you do not have");
    }

    await this.chartShareRepo.upsert(
      { chartId, sharedWithUserId, sharedByUserId, ...permissions },
      { conflictPaths: ["chartId", "sharedWithUserId"], skipUpdateIfNoValuesChanged: false },
    );

    // Auto-share parent directories (view-only, insert-if-not-exists to avoid downgrading existing permissions)
    const parentDirs = await this.cidRepo.find({ where: { chartId }, select: ["directoryId"] });
    for (const { directoryId } of parentDirs) {
      await this.shareDirRepo
        .createQueryBuilder()
        .insert()
        .into(DirectoryShareEntity)
        .values({ directoryId, sharedWithUserId, sharedByUserId, canEdit: false, canDelete: false, canShare: false })
        .orIgnore()
        .execute();
    }
  }

  async unshareChart(chartId: string, sharedWithUserId: string): Promise<void> {
    await this.chartShareRepo.delete({ chartId, sharedWithUserId });
  }

  async getChartShares(chartId: string): Promise<ChartShareEntity[]> {
    return this.chartShareRepo.find({ where: { chartId } });
  }

  async getChartMetadataById(id: string, userId: string): Promise<ChartMetadata> {
    const chart = await this.chartRepo.findOne({ where: { id } });
    if (!chart) throw new NotFoundException(`Chart with ID ${id} not found`);
    const shareMap = await this.buildShareMap([id], userId);
    return this.convertChartToChartMetadata(chart, this.computePrivileges(chart, userId, shareMap));
  }

  async updateChart(chartId: string, dto: ChartUpdate, userId: string): Promise<Chart> {
    const updated = await this.dataSource.transaction(async (manager: EntityManager) => {
      const chartsRepo = manager.getRepository(ChartEntity);

      // 0) Load + lock check + resource-level permission
      const chart = await chartsRepo.findOne({
        where: { id: chartId },
        relations: { devicesOnChart: true, bondOnChart: true },
      });
      if (!chart) throw new ChartNotFoundExeption(chartId);
      if (chart.createdByUserId !== userId) {
        const share = await this.chartShareRepo.findOne({ where: { chartId, sharedWithUserId: userId } });
        if (!share?.canEdit) throw new ForbiddenException("No edit permission on this chart");
      }
      if (chart.lockedById && chart.lockedById !== userId)
        throw new ChartIsLockedExeption(chartId, chart.lockedById);

      // 1) Meta (global)
      if (dto.name !== undefined) chart.name = dto.name;
      if (dto.description !== undefined) chart.description = dto.description ?? "";
      chart.updatedByUserId = userId;
      if (dto.name !== undefined || dto.description !== undefined) await chartsRepo.save(chart);

      // 2) DevicesOnChart (instance only)
      if (dto.devicesOnChart !== undefined) {
        await this.devicesOnChartService.syncPlacementsAndHandles(manager, chartId, dto.devicesOnChart,userId);
      }

      // 3) Lines (global) + LineOnChart (instance)
      if (dto.linesOnChart !== undefined) {
        const wantedLines = dto.linesOnChart.map(l => l.line);
        const normalizedLines = await this.linesService.upsertLines(manager, wantedLines, userId); // global
        // Build a map from old frontend UUID → normalized DB ID so syncLinks uses correct IDs
        const idMap = new Map(wantedLines.map((l, i) => [l.id, normalizedLines[i]?.id ?? l.id]));
        const normalizedLinesOnChart = dto.linesOnChart.map(loc => ({
          ...loc,
          line: { ...loc.line, id: idMap.get(loc.line.id) ?? loc.line.id },
        }));
        await this.linesOnChartService.syncLinks(manager, chartId, normalizedLinesOnChart); // instance
      }

      // 4) Bonds (global) + BondOnChart (instance)
      if (dto.bondsOnChart !== undefined) {
        const globalBonds = dto.bondsOnChart.map(b => b.bond);
        await this.linesService.ensureAndUpdateBonds(manager, globalBonds,userId); // global
        await this.bondsOnChartService.syncLinks(manager, chartId, dto.bondsOnChart); // instance
      }

      // 5) Notes (instance only — no global entity)
      if (dto.notesOnChart !== undefined) {
        await this.notesOnChartService.syncNotes(manager, chartId, dto.notesOnChart);
      }

      // 5b) Zones on chart (instance only — no global entity)
      if (dto.zonesOnChart !== undefined) {
        await this.zonesOnChartService.syncZones(manager, chartId, dto.zonesOnChart);
      }

      // 5c) Clouds on chart (instance only — references global clouds)
      if (dto.cloudsOnChart !== undefined) {
        await this.cloudsOnChartService.syncCloudsOnChart(manager, chartId, dto.cloudsOnChart);
      }

      // 5d) Custom elements on chart (instance only — references global custom elements)
      if (dto.customElementsOnChart !== undefined || dto.customElementEdgesOnChart !== undefined) {
        await this.customElementsOnChartService.syncCustomElementsOnChart(
          manager,
          chartId,
          dto.customElementsOnChart ?? [],
          dto.customElementEdgesOnChart ?? [],
        );
      }

      // 6) Hard deletes (global)
      if (dto.deletes) {
        const { devices, lines, ports } = dto.deletes;
        if (devices?.length) await manager.getRepository(DeviceEntity).delete(devices);
        if (lines?.length)   await manager.getRepository(LineEntity).delete(lines);
        if (ports?.length)   await manager.getRepository(PortEntity).delete(ports);
      }

      // 7) Return fresh chart
      return chartsRepo.findOneOrFail({
        where: { id: chartId },
        relations: {
          devicesOnChart: {
            device: { model: { vendor: true }, ports: true },
            portPlacements: { port: true },
          },
          linesOnChart: { line: { sourcePort: true, targetPort: true } },
          bondOnChart: { bond: { members: true } },
          notesOnChart: true,
          cloudsOnChart: { cloud: true, connections: true },
          customElementsOnChart: { customElement: true },
          customElementEdgesOnChart: true,
        },
      });
    });

    // post-commit maintenance
    await this.linesService.deleteOrphanLines();
    await this.portsService.recomputePortsInUse();

    const converted = await this.convertChartEntityToChart(updated);
    const result = await this.enrichPortsWithConnectedPortIds(converted);
    await this.chartVersionsService.saveVersion(chartId, result, userId, dto.versionLabel);
    return result;
  }

  // ---------- lock/remove ----------
  async removeChart(id: string, userId: string): Promise<void> {
    const chart = await this.chartRepo.findOne({ where: { id } });
    if (!chart) throw new ChartNotFoundExeption(id);
    if (chart.createdByUserId !== userId) {
      const share = await this.chartShareRepo.findOne({ where: { chartId: id, sharedWithUserId: userId } });
      if (!share?.canDelete) throw new ForbiddenException("No delete permission on this chart");
    }
    if (chart.lockedById && chart.lockedById !== userId)
      throw new ChartIsLockedExeption(id, chart.lockedById);
    await this.chartRepo.remove(chart);
    await this.linesService.deleteOrphanLines();
    await this.portsService.recomputePortsInUse();
  }

  async fetchLock(chartId: string, userId: string): Promise<ChartLock> {
    const chart : ChartLockFeilds | null = await this.chartRepo.findOne({
      where: { id: chartId },
      select: { lockedAt: true, id: true, lockedById: true, lockedBy: true },
      relations: { lockedBy: true },
    });
    if(!chart) throw new ChartNotFoundExeption(chartId)
    return this.getLockFromChartEntity(chart)
  }

  async lockChart(chartId: string, userId: string): Promise<ChartLock> {
    const chart: ChartEntity | null = await this.chartRepo.findOne({
      where: { id: chartId },
      relations: {lockedBy:true },
    });
    if (!chart) throw new ChartNotFoundExeption(chartId);
    if (chart.lockedById && chart.lockedById !== userId)
      throw new ChartIsLockedExeption(chartId, chart.lockedById);
    if (!chart.lockedById) {
      chart.lockedById = userId;
      chart.lockedAt = new Date();
      await this.chartRepo.save(chart);
    }
    return this.getLockFromChartEntity(chart)
  }

  async unlockChart(chartId: string, userId: string): Promise<ChartLock> {
    const chart: ChartEntity | null = await this.chartRepo.findOne({ where: { id: chartId } });
    if (!chart) throw new ChartNotFoundExeption(chartId);
    if (!chart.lockedById || !chart.lockedAt ) return this.getLockFromChartEntity(chart)
    if (chart.lockedById && chart.lockedById !== userId)
      throw new ChartIsLockedExeption(chartId,chart.lockedById)

    await this.chartRepo.update(chartId, { lockedById: null, lockedAt: null });
    const updatedChart = await this.chartRepo.findOne({ where: { id: chartId }, relations: { lockedBy: true } });
    if(!updatedChart) throw new Error('Enable to un lock chart')
    return this.getLockFromChartEntity(updatedChart)
  }
}
