// src/charts/charts.service.ts
import {
  BondOnChart,
  ChartLock,
  LineOnChart,
  type Chart,
  type ChartCreate,
  type ChartMetadata,
  type ChartUpdate,
  type DeviceOnChart
} from "@Easy-charts/easycharts-types";
import {
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, EntityManager, Repository } from "typeorm";
import { DeviceEntity } from "../devices/entities/device.entity";
import { PortEntity } from "../devices/entities/port.entity";
import { PortsService } from "../devices/ports.service";
import { LineEntity } from "../lines/entities/line.entity";
import { LinessService } from "../lines/lines.service";
import { BondsOnChartService } from "./bondOnChart.service";
import { ChartLockFeilds } from "./chartLockes.types";
import { DevicesOnChartService } from "./deviceOnChart.service";
import { ChartEntity } from "./entities/chart.entity";
import { ChartIsLockedExeption } from "./exeptions/chartIsLocked.exeption";
import { ChartNotFoundExeption } from "./exeptions/chartNotFound.exeption";
import { LinesOnChartService } from "./lineOnChart.service";
import { PortsOnChartService } from "./portsOnChart.service";

@Injectable()
export class ChartsService {
  constructor(
    private readonly dataSource: DataSource,

    @InjectRepository(ChartEntity)
    private readonly chartRepo: Repository<ChartEntity>,

    // Global services (no knowledge of *OnChart)
    private readonly linesService: LinessService,
    private readonly portsService: PortsService,

    // Instance-level services (only *OnChart)
    private readonly devicesOnChartService: DevicesOnChartService,
    private readonly linesOnChartService: LinesOnChartService,
    private readonly bondsOnChartService: BondsOnChartService,
    private readonly portsOnChartService:PortsOnChartService,
  ) {}

  getLockFromChartEntity = (chartEntiy: ChartLockFeilds): ChartLock => {
    return {
      chartId: chartEntiy.id,
      lockedAt: chartEntiy.lockedAt ?? null,
      lockedById: chartEntiy.lockedById ?? null,
      lockedByName: chartEntiy.lockedBy ? chartEntiy.lockedBy.username : "",
    } as ChartLock;
  };

  convertChartEntityToChart = async (
    chartEnrity: ChartEntity
  ): Promise<Chart> => {
    const { devicesOnChart, linesOnChart, bondOnChart,createdAt,createdByUserId,updatedAt,updatedByUserId, ...chartData } = chartEnrity;
    const convertedDeviceOnCharts: DeviceOnChart[] = [];
    for (const dl of devicesOnChart) convertedDeviceOnCharts.push(await this.devicesOnChartService.convertDeviceOnChartEntity(dl));

    const convertedLinesOnChart: LineOnChart[] = [];
    for (const ll of linesOnChart ?? []) convertedLinesOnChart.push(await this.linesOnChartService.convertLineonChartEntity(ll));

    const convertedBondOnChart: BondOnChart[] = [];
    for (const b of bondOnChart ?? []) convertedBondOnChart.push(this.bondsOnChartService.convertBondOnChartEntity(b));

    return {
      devicesOnChart: convertedDeviceOnCharts,
      linesOnChart: convertedLinesOnChart,
      lock: this.getLockFromChartEntity(chartEnrity),
      bondsOnChart: convertedBondOnChart,
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
      },
    });
    if (!chart) throw new NotFoundException("chart not found");
    return await this.convertChartEntityToChart(chart);
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
    return this.convertChartEntityToChart(newChart);
  }

  convertChartToChartMetadata(chartEntity: ChartEntity): ChartMetadata {
    const { createdAt, createdByUserId, description, id, name } = chartEntity;
    return {
      createdAt,
      createdByUserId,
      description,
      id,
      name,
      lock: this.getLockFromChartEntity(chartEntity),
    } as ChartMetadata;
  }

  async getAllUserChartsMetadata(userId: string): Promise<ChartMetadata[]> {
    const charts = await this.chartRepo.find({ where: { createdByUserId: userId } });
    return charts.map((c) => this.convertChartToChartMetadata(c)) as ChartMetadata[];
  }

  async getChartMetadataById(id: string): Promise<ChartMetadata> {
    const chart = await this.chartRepo.findOne({ where: { id } });
    if (!chart) throw new NotFoundException(`Chart with ID ${id} not found`);
    return this.convertChartToChartMetadata(chart);
  }

  async updateChart(chartId: string, dto: ChartUpdate, userId: string): Promise<Chart> {
    const updated = await this.dataSource.transaction(async (manager: EntityManager) => {
      const chartsRepo = manager.getRepository(ChartEntity);

      // 0) Load + lock check
      const chart = await chartsRepo.findOne({
        where: { id: chartId },
        relations: { devicesOnChart: true, bondOnChart: true },
      });
      if (!chart) throw new ChartNotFoundExeption(chartId);
      if (chart.lockedById && chart.lockedById !== userId)
        throw new ChartIsLockedExeption(chartId, chart.lockedById);

      // 1) Meta (global)
      if (dto.name !== undefined) chart.name = dto.name;
      if (dto.description !== undefined) chart.description = dto.description ?? "";
      chart.updatedByUserId=userId
      if (dto.name !== undefined || dto.description !== undefined) await chartsRepo.save(chart);

      // 2) DevicesOnChart (instance only)
      if (dto.devicesOnChart !== undefined) {
        await this.devicesOnChartService.syncPlacementsAndHandles(manager, chartId, dto.devicesOnChart,userId);
      }

      // 3) Lines (global) + LineOnChart (instance)
      if (dto.linesOnChart !== undefined) {
        const wantedLines = dto.linesOnChart.map(l => l.line);
        await this.linesService.upsertLines(manager, wantedLines,userId);   // global
        await this.linesOnChartService.syncLinks(manager, chartId, dto.linesOnChart); // instance
      }

      // 4) Bonds (global) + BondOnChart (instance)
      if (dto.bondsOnChart !== undefined) {
        const globalBonds = dto.bondsOnChart.map(b => b.bond);
        await this.linesService.ensureAndUpdateBonds(manager, globalBonds,userId); // global
        await this.bondsOnChartService.syncLinks(manager, chartId, dto.bondsOnChart); // instance
      }

      // 5) Hard deletes (global)
      if (dto.deletes) {
        const { devices, lines, ports } = dto.deletes;
        if (devices?.length) await manager.getRepository(DeviceEntity).delete(devices);
        if (lines?.length)   await manager.getRepository(LineEntity).delete(lines);
        if (ports?.length)   await manager.getRepository(PortEntity).delete(ports);
      }

      // 6) Return fresh chart
      return chartsRepo.findOneOrFail({
        where: { id: chartId },
        relations: {
          devicesOnChart: {
            device: { model: { vendor: true }, ports: true },
            portPlacements: { port: true },
          },
          linesOnChart: { line: { sourcePort: true, targetPort: true } },
          bondOnChart: { bond: { members: true } },
        },
      });
    });

    // post-commit maintenance
    await this.linesService.deleteOrphanLines();
    await this.portsService.recomputePortsInUse();

    return this.convertChartEntityToChart(updated);
  }

  // ---------- lock/remove unchanged ----------
  async removeChart(id: string, userId: string): Promise<void> {
    const chart = await this.chartRepo.findOne({ where: { id } });
    if (!chart) throw new ChartNotFoundExeption(id);
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
