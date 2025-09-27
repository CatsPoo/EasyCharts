// src/charts/charts.service.ts
import {
  ChartLock,
  HandleInfo,
  Line,
  LineOnChart,
  Port,
  SIDES,
  type Chart,
  type ChartCreate,
  type ChartMetadata,
  type ChartUpdate,
  type DeviceOnChart,
  type Handles,
  type Side
} from "@Easy-charts/easycharts-types";
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, In, Not, Repository } from "typeorm";
import { DevicesService } from "../devices/devices.service";
import { DeviceEntity } from "../devices/entities/device.entity";
import { PortEntity } from "../devices/entities/port.entity";
import { PortsService } from "../devices/ports.service";
import { LineEntity } from "../lines/entities/line.entity";
import { LinessService } from "../lines/lines.service";
import { ChartEntity } from "./entities/chart.entity";
import { DeviceOnChartEntity } from "./entities/deviceOnChart.entityEntity";
import { LineOnChartEntity } from "./entities/lineonChart.emtity";
import { PortOnChartEntity } from "./entities/portOnChart.entity";
import { ChartIsLockedExeption } from "./exeptions/chartIsLocked.exeption";
import { ChartNotFoundExeption } from "./exeptions/chartNotFound.exeption";
@Injectable()
export class ChartsService {
  constructor(
    private readonly dataSource: DataSource,

    @InjectRepository(ChartEntity)
    private readonly chartRepo: Repository<ChartEntity>,

    private readonly devicesService: DevicesService,
    private readonly linesService: LinessService,
    private readonly portsService: PortsService
  ) {}

  convertPortEntityToPort(portEntity: PortEntity): Port {
    const { id, name, type, deviceId } = portEntity;
    return { id, name, type, deviceId } as Port;
  }

  handlesToRows(chartId: string, deviceId: string, handles?: Handles) {
    const rows: Array<
      Pick<PortOnChartEntity, "chartId" | "deviceId" | "portId" | "side">
    > = [];
    if (!handles) return rows;
    SIDES.forEach((side: Side) => {
      const arr = handles[side] ?? [];
      arr.forEach((p, idx) => {
        rows.push({ chartId, deviceId, portId: p.port.id, side });
      });
    });
    return rows;
  }

  rowsToHandles(placements: PortOnChartEntity[]): Handles {
    const bySide: Record<Side, HandleInfo[]> = {
      left: [],
      right: [],
      top: [],
      bottom: [],
    };
    for (const r of placements) {
      bySide[r.side].push({ port: this.convertPortEntityToPort(r.port) });
    }
    return bySide;
  }

  getLockFromChartEntity = (chartEntiy:ChartEntity) : ChartLock =>{
    return {
      chartId:chartEntiy.id,
      lockedAt:chartEntiy.lockedAt ?? null,
      lockedById:chartEntiy.lockedById ?? null,
      lockedByName:chartEntiy.lockedBy ? chartEntiy.lockedBy.username :  "",
    } as ChartLock
  }

  convertDeviceOnChartEntity = async (
    deviceonChartEntity: DeviceOnChartEntity
  ): Promise<DeviceOnChart> => {
    const { chartId, position, device, portPlacements } = deviceonChartEntity;
    return {
      chartId,
      device: this.devicesService.convertDeviceEntity(device),
      position,
      handles: this.rowsToHandles(portPlacements ?? []),
    } as DeviceOnChart;
  };

  convertLineonChartEntity = async (
    lineOnChartEntity: LineOnChartEntity
  ): Promise<LineOnChart> => {
    const { line: lineEntity, label, type, chartId } = lineOnChartEntity;
    return {
      label,
      type,
      chartId,
      line: this.linesService.convertLineEntity(lineEntity),
    } as LineOnChart;
  };

  convertChartEntityToChart = async (
    chartEnrity: ChartEntity
  ): Promise<Chart> => {
    const { devicesOnChart, linesOnChart, ...chartData } = chartEnrity;
    const convertedDeviceOnCharts: DeviceOnChart[] = [];
    for (const dl of devicesOnChart) {
      convertedDeviceOnCharts.push(await this.convertDeviceOnChartEntity(dl));
    }

    const convertedLinesOnChart: LineOnChart[] = [];
    for (const ll of linesOnChart ?? []) {
      convertedLinesOnChart.push(await this.convertLineonChartEntity(ll));
    }

    return {
      devicesOnChart: convertedDeviceOnCharts,
      linesOnChart: convertedLinesOnChart,
      lock: this.getLockFromChartEntity(chartEnrity),
      ...chartData,
    } as Chart;
  };

  async getAllCharts(): Promise<Chart[]> {
    const convertedCharts: Chart[] = [];
    const charts = await this.chartRepo.find({});
    for (const c of charts) {
      convertedCharts.push(await this.convertChartEntityToChart(c));
    }
    return convertedCharts;
  }

  async getChartById(id: string): Promise<Chart> {
    const chart: ChartEntity | null = await this.chartRepo.findOne({
      where: { id },
      relations: {
        devicesOnChart: {
          device: {
            model: {
              vendor: true,
            },
            ports: true,
          },
          portPlacements: {
            port: true,
          },
          position: true,
        },
        linesOnChart: {
          line: {
            sourcePort: true,
            targetPort: true,
          },
        },
      },
    });
    if (!chart) throw new NotFoundException("chart not found");
    return await this.convertChartEntityToChart(chart);
  }

  async createChart(createdById: string, dto: ChartCreate): Promise<Chart> {
    const chart: ChartEntity = this.chartRepo.create({
      name: dto.name,
      description: dto.description,
      createdById,
      devicesOnChart: dto.devicesOnChart.map((dl) => ({
        deviceId: dl.device.id,
        position: dl.position,
      })),
    });
    const newChart: ChartEntity = await this.chartRepo.save(chart);
    return this.convertChartEntityToChart(newChart);
  }

  convertChartToChartMetadata(chartEntity:ChartEntity) : ChartMetadata{
      const {createdAt,createdById,description,id,name} = chartEntity
      return {
        createdAt,
        createdById,
        description,
        id,
        name,
        lock:this.getLockFromChartEntity(chartEntity)
      } as ChartMetadata
  }
  async getAllUserChartsMetadata(userId: string): Promise<ChartMetadata[]> {
    const charts = await this.chartRepo.find({
      where: { createdById: userId },
    });
    
    return charts.map(c=>{
      return this.convertChartToChartMetadata(c)
    }) as ChartMetadata[]
  }
  async getChartMetadataById(id: string): Promise<ChartMetadata> {
    const chart = await this.chartRepo.findOne({
      where: { id },
    });

    if (!chart) {
      throw new NotFoundException(`Chart with ID ${id} not found`);
    }
    return this.convertChartToChartMetadata(chart)
  }

  async updateChart(chartId: string, dto: ChartUpdate,userId:string): Promise<Chart> {
    const updated = await this.dataSource.transaction(async (manager) => {
      const chartsRepo = manager.getRepository(ChartEntity);
      const docRepo = manager.getRepository(DeviceOnChartEntity);
      const pocRepo = manager.getRepository(PortOnChartEntity);
      const deviceRepo = manager.getRepository(DeviceEntity);
      const portRepo = manager.getRepository(PortEntity);
      const lineRepo = manager.getRepository(LineEntity);
      const locRepo = manager.getRepository(LineOnChartEntity);

      // ---- 0) Load chart
      const chart = await chartsRepo.findOne({
        where: { id: chartId },
        relations: { devicesOnChart: true },
      });
      if (!chart) throw new ChartNotFoundExeption(chartId);
      if(chart.lockedById && chart.lockedById !== userId)
        throw new ChartIsLockedExeption(chartId,chart.lockedById)

      // ---- 1) Meta
      if (dto.name !== undefined) chart.name = dto.name;
      if (dto.description !== undefined)
        chart.description = dto.description ?? "";
      if (dto.name !== undefined || dto.description !== undefined) {
        await chartsRepo.save(chart);
      }

      // ---- 2) Devices, Ports, Handles (placements)
      if (dto.devicesOnChart !== undefined) {
        const placements = dto.devicesOnChart;

        // a) Validate devices exist
        const uniqDeviceIds = [...new Set(placements.map((d) => d.device.id))];
        if (uniqDeviceIds.length) {
          const count = await deviceRepo.count({
            where: { id: In(uniqDeviceIds) },
          });
          if (count !== uniqDeviceIds.length) {
            throw new BadRequestException("One or more devices do not exist");
          }
        }

        // a.1) **UPSERT PORTS** coming from editor (new or edited)
        // Collect all ports from the payload's devices
        const incomingPorts = [];
        for (const d of placements) {
          const devId = d.device.id;
          for (const p of d.device.ports ?? []) {
            // enforce device binding here
            incomingPorts.push({
              id: p.id,
              name: p.name,
              type: p.type,
              deviceId: devId,
            } as Partial<PortEntity>);
          }
        }

        if (incomingPorts.length) {
          // Check for deviceId conflicts on existing ports before upserting
          const ids = [...new Set(incomingPorts.map((p) => p.id!))];
          const existing = await portRepo.find({
            where: { id: In(ids) },
            select: ["id", "deviceId"],
          });
          const existingById = new Map(existing.map((e) => [e.id, e]));
          const conflicts = incomingPorts.filter((p) => {
            const ex = existingById.get(p.id!);
            return ex && ex.deviceId !== p.deviceId;
          });
          if (conflicts.length) {
            throw new BadRequestException(
              `Port(s) belong to a different device: ${conflicts
                .map((c) => c.id)
                .join(", ")}`
            );
          }

          // Upsert ports (idempotent)
          await portRepo.upsert(incomingPorts, {
            conflictPaths: ["id"],
            skipUpdateIfNoValuesChanged: true,
          });
        }

        // b) Upsert device placements
        await docRepo.upsert(
          placements.map((d) => ({
            chartId,
            deviceId: d.device.id,
            position: d.position,
          })),
          ["chartId", "deviceId"]
        );

        // c) Remove device placements not present anymore
        const desiredIds = new Set(placements.map((d) => d.device.id));
        const existingDocs = await docRepo.find({ where: { chartId } });
        const toRemove = existingDocs.filter(
          (e) => !desiredIds.has(e.deviceId)
        );
        if (toRemove.length) await docRepo.remove(toRemove);

        // d) Replace port placements (handles) per device
        for (const d of placements) {
          if (!("handles" in d) || d.handles == null) continue;

          const desiredRows = this.handlesToRows(
            chartId,
            d.device.id,
            d.handles
          );

          // Validate each port belongs to this device (now that ports exist)
          if (desiredRows.length) {
            const distinctPortIds = [
              ...new Set(desiredRows.map((r) => r.portId)),
            ];
            const cnt = await portRepo.count({
              where: { id: In(distinctPortIds), deviceId: d.device.id },
            });
            if (cnt !== distinctPortIds.length) {
              throw new BadRequestException(
                "One or more ports do not belong to this device"
              );
            }
          }

          await pocRepo.delete({ chartId, deviceId: d.device.id });
          if (desiredRows.length) await pocRepo.insert(desiredRows);
        }
      }
      // ---- 3) Lines (global + per-chart instance)
      if (dto.linesOnChart !== undefined) {
        const linesOnChart: LineOnChart[] = dto.linesOnChart;
        for (const loc of linesOnChart) {
          if (!loc?.line?.id)
            throw new BadRequestException("LineEntity.id is required");
          const spid = loc.line.sourcePort.id;
          const tpid = loc.line.targetPort.id;
          if (!spid || !tpid)
            throw new BadRequestException(
              "sourcePortId/targetPortId are required"
            );
          if (spid === tpid)
            throw new BadRequestException(
              "sourcePortId and targetPortId must be different"
            );
        }
        const wantedLines: Line[] = dto.linesOnChart.map((loc) => loc.line);
        await lineRepo.upsert(
          wantedLines.map((l) => this.linesService.convertLineToEntity(l)),
          {
            conflictPaths: ["id"],
            skipUpdateIfNoValuesChanged: true,
          }
        );

        await locRepo.upsert(
          dto.linesOnChart.map((l) => {
            return {
              chartId: l.chartId,
              lineId: l.line.id,
              label: l.label,
              type: l.type,
            } as LineOnChartEntity;
          }),
          {
            conflictPaths: ["chartId", "lineId"],
            skipUpdateIfNoValuesChanged: true,
          }
        );

        await locRepo.delete({
          chartId: chartId,
          lineId: Not(In(dto.linesOnChart.map((loc) => loc.line.id))),
        });

        // delete entities permenantly from db
        if (dto.deletes) {
          const { devices, lines, ports } = dto.deletes;
          if (devices && devices.length > 0) await deviceRepo.delete(devices);
          if (lines && lines.length > 0) await lineRepo.delete(lines);
          if (ports && ports.length > 0) await portRepo.delete(ports);
        }
      }

      this.linesService
        .deleteOrphanLines()
        .then(() => this.portsService.recomputePortsInUse());

      // ---- 4) Return fresh chart with full relations
      return chartsRepo.findOneOrFail({
        where: { id: chartId },
        relations: {
          devicesOnChart: {
            device: { model: { vendor: true }, ports: true },
            portPlacements: { port: true },
          },
          linesOnChart: {
            line: {
              sourcePort: true,
              targetPort: true,
            },
          },
        },
      });
    });

    return this.convertChartEntityToChart(updated);
  }

  async removeChart(id: string,userId:string): Promise<void> {
    const chart = await this.chartRepo.findOne({ where: { id } });
    if (!chart) throw new ChartNotFoundExeption(id)
      
    if(chart.lockedById && chart.lockedById !==userId)
      throw new ChartIsLockedExeption(id, chart.lockedById);

    await this.chartRepo.remove(chart); // cascades will clean placements/lines
    this.linesService
      .deleteOrphanLines()
      .then(() => this.portsService.recomputePortsInUse());
  }

  async lockChart(chartId:string,userId:string) : Promise<ChartLock>{
    const chart : ChartEntity | null = await this.chartRepo.findOne({where:{id:chartId},relations:{createdBy:true}})
    if(!chart)
      throw new ChartNotFoundExeption(chartId)
    if(chart.lockedById && chart.lockedById !== userId)
      throw new ChartIsLockedExeption(chartId,chart.lockedById)
    if(!chart.lockedById){
      chart.lockedById = userId;
      chart.lockedAt = new Date();
      await this.chartRepo.save(chart);
    }
    return {
      chartId,
      lockedById:chart.lockedById,
      lockedByName:chart.lockedBy.username,
      lockedAt:chart.lockedAt
    } as ChartLock

  }

  async unlockChart(chartId:string,userId:string) : Promise<void>{
     const chart : ChartEntity | null = await this.chartRepo.findOne({where:{id:chartId}})
    if(!chart)
      throw new NotFoundException(`Chart ${chartId} not found`);

    if(!chart.lockedById) return

    if(chart.lockedById && chart.lockedById !== userId)
      throw new BadRequestException(`Chart ${chartId} already locked by user ${chart.lockedById}`)

    chart.lockedById = null
    chart.lockedAt = null
    this .chartRepo.save(chart)
  }
}
