// src/charts/charts.service.ts
import {
  HandleInfo,
  LineOnChart,
  LineType,
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
import { DataSource, In, Repository } from "typeorm";
import { DevicesService } from "../devices/devices.service";
import { DeviceEntity } from "../devices/entities/device.entity";
import { PortEntity } from "../devices/entities/port.entity";
import { ChartEntity } from "./entities/chart.entity";
import { DeviceOnChartEntity } from "./entities/deviceOnChart.entityEntity";
import { PortOnChartEntity } from "./entities/portOnChart.entity";
import { LineOnChartEntity } from "./entities/lineonChart.emtity";
import { LinessService } from "../lines/lines.service";
import { LineEntity } from "../lines/entities/line.entity";
@Injectable()
export class ChartsService {
  constructor(
    private readonly dataSource: DataSource,

    @InjectRepository(ChartEntity)
    private readonly chartRepo: Repository<ChartEntity>,

    private readonly devicesService: DevicesService,
    private readonly linesService:LinessService
  ) {}

  convertPortEntityToPort(portEntity: PortEntity): Port {
    const { id, name, type, deviceId} = portEntity; 
    return { id, name, type, deviceId } as Port;
  }

  handlesToRows(
  chartId: string,
  deviceId: string,
  handles?:Handles,
) {
  const rows: Array<Pick<PortOnChartEntity, "chartId"|"deviceId"|"portId"|"side">> = [];
  if (!handles) return rows;
  SIDES.forEach((side: Side) => {
    const arr = handles[side] ?? [];
    arr.forEach((p, idx) => {
      rows.push({ chartId, deviceId, portId: p.port.id, side });
    });
  });
  return rows;
}

 rowsToHandles(placements: PortOnChartEntity[]) :Handles{
  const bySide: Record<Side, HandleInfo[]> = { left: [], right: [], top: [], bottom: [] };
  for (const r of placements) {
    bySide[r.side].push({port:this.convertPortEntityToPort(r.port), direction: r.direction});
  }
  return bySide;
}

  convertDeviceOnChartEntity = async (
    deviceonChartEntity: DeviceOnChartEntity
  ): Promise<DeviceOnChart> => {
    const { chartId, position, device, portPlacements } = deviceonChartEntity;
    return {
      chartId,
      device: this.devicesService.convertDeviceEntity(device),
      position,
      handles: this.rowsToHandles(portPlacements ?? []) 
    } as DeviceOnChart;
  };

  convertLineonChartEntity = async (lineOnChartEntity:LineOnChartEntity) :Promise<LineOnChart>=>{
    const {id, line:lineEntity, label,type,chartId } = lineOnChartEntity;
    return {
      id,
      label,
      type,
      chartId,
      line: this.linesService.convertLineEntity(lineEntity)
    } as LineOnChart;
  }

  //TODO all lines to convertion function
  convertChartEntityToChart = async (chartEnrity: ChartEntity): Promise<Chart> => {
    const { devicesOnChart,linesOnChart, ...chartData } = chartEnrity;
    let convertedDeviceOnCharts : DeviceOnChart[] = []
    for(const dl of devicesOnChart){
      convertedDeviceOnCharts.push(await this.convertDeviceOnChartEntity(dl)); 
    }

    let convertedLinesOnChart:LineOnChart[] =[]
    for(const ll of linesOnChart ?? []){
      convertedLinesOnChart.push(await this.convertLineonChartEntity(ll));
    }

    console.log({
      devicesOnChart: convertedDeviceOnCharts,
      linesOnChart: convertedLinesOnChart,
      ...chartData,
    })
    return {
      devicesOnChart: convertedDeviceOnCharts,
      linesOnChart: convertedLinesOnChart,
      ...chartData,
    } as Chart;
  };

  async getAllCharts(): Promise<Chart[]> {
    let convertedCharts:Chart[]=[]
    const charts = await this.chartRepo.find({});
    for(const c of charts){
      convertedCharts.push(await this.convertChartEntityToChart(c));
    }
    return convertedCharts
  }

  async getChartById(id: string): Promise<Chart> {
    const chart: ChartEntity | null = await this.chartRepo.findOne({
      where: { id },
      relations: {
        devicesOnChart:{
          device: {
             model: {
               vendor: true 
              },
              ports: true,
            },
          portPlacements: {
             port: true,
          },
          position:true
        },
        linesOnChart:{
          line:true 
        }
      },
    });
    if (!chart) throw new NotFoundException("chart not found");
    return await this.convertChartEntityToChart(chart);
  }

  //TODO Add lines to create dto
  async createChart(dto: ChartCreate): Promise<Chart> {
    const chart: ChartEntity = this.chartRepo.create({
      name: dto.name,
      description: dto.description,
      devicesOnChart: dto.devicesOnChart.map((dl) => ({
        deviceId: dl.device.id,
        position: dl.position,
      })),
    });
    const newChart: ChartEntity = await this.chartRepo.save(chart);
    return this.convertChartEntityToChart(newChart);
  }

  async getAllChartsMetadata(): Promise<ChartMetadata[]> {
    const charts = await this.chartRepo.find({
      select: ["id", "name", "description"],
    });

    return charts as ChartMetadata[];
  }
  async getChartMetadataById(id: string): Promise<ChartMetadata> {
    const chart = await this.chartRepo.findOne({
      where: { id },
      select: ["id", "name", "description"], // Only the metadata fields
    });

    if (!chart) {
      throw new NotFoundException(`Chart with ID ${id} not found`);
    }

    return chart as ChartMetadata;
  }

  async updateChart(chartId: string, dto: ChartUpdate): Promise<Chart> {
  const updated = await this.dataSource.transaction(async (manager) => {
    const chartsRepo = manager.getRepository(ChartEntity);
    const docRepo    = manager.getRepository(DeviceOnChartEntity);
    const pocRepo    = manager.getRepository(PortOnChartEntity);
    const deviceRepo = manager.getRepository(DeviceEntity);
    const portRepo   = manager.getRepository(PortEntity);
    const lineRepo   = manager.getRepository(LineEntity);
    const locRepo    = manager.getRepository(LineOnChartEntity);

    // ---- 0) Load chart
    const chart = await chartsRepo.findOne({
      where: { id: chartId },
      relations: { devicesOnChart: true },
    });
    if (!chart) throw new NotFoundException(`Chart ${chartId} not found`);

    // ---- 1) Meta
    if (dto.name !== undefined) chart.name = dto.name;
    if (dto.description !== undefined) chart.description = dto.description ?? "";
    if (dto.name !== undefined || dto.description !== undefined) {
      await chartsRepo.save(chart);
    }

    // ---- 2) Devices & Port placements (handles)
    if (dto.devicesOnChart !== undefined) {
      const placements = dto.devicesOnChart;

      // a) Validate devices exist
      const uniqDeviceIds = [...new Set(placements.map((d) => d.device.id))];
      if (uniqDeviceIds.length) {
        const count = await deviceRepo.count({ where: { id: In(uniqDeviceIds) } });
        if (count !== uniqDeviceIds.length) {
          throw new BadRequestException("One or more devices do not exist");
        }
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
      const toRemove = existingDocs.filter((e) => !desiredIds.has(e.deviceId));
      if (toRemove.length) await docRepo.remove(toRemove);

      // d) For each device, replace its port placements (delete+bulk insert)
      for (const d of placements) {
        if (!("handles" in d) || d.handles == null) continue;

        const desiredRows = this.handlesToRows(chartId, d.device.id, d.handles);

        // Validate each port belongs to this device
        if (desiredRows.length) {
          const distinctPortIds = [...new Set(desiredRows.map((r) => r.portId))];
          const cnt = await portRepo.count({
            where: { id: In(distinctPortIds), deviceId: d.device.id },
          });
          if (cnt !== distinctPortIds.length) {
            throw new BadRequestException("One or more ports do not belong to this device");
          }
        }

        await pocRepo.delete({ chartId, deviceId: d.device.id });
        if (desiredRows.length) await pocRepo.insert(desiredRows);
      }
    }

    // ---- 3) Lines (global + per-chart instance)
    if (dto.linesOnChart !== undefined) {
      const desired = dto.linesOnChart;

      // a) Validate source != target (DB CHECK also enforces)
      for (const l of desired) {
        if (l.line.sourcePortId === l.line.targetPortId) {
          throw new BadRequestException("sourcePortId and targetPortId must be different");
        }
      }

      // b) Validate ports exist & devices are placed on this chart
      const wantedPortIds = [
        ...new Set(desired.flatMap((l) => [l.line.sourcePortId, l.line.targetPortId])),
      ];
      const ports = wantedPortIds.length
        ? await portRepo.find({
            where: { id: In(wantedPortIds) },
            select: ["id", "deviceId"],
          })
        : [];
      const portsById = new Map(ports.map((p) => [p.id, p]));
      for (const l of desired) {
        const sp = portsById.get(l.line.sourcePortId);
        const tp = portsById.get(l.line.targetPortId);
        if (!sp || !tp) {
          throw new BadRequestException("One or more ports do not exist");
        }
        const placedCnt = await docRepo.count({
          where: { chartId, deviceId: In([sp.deviceId, tp.deviceId]) },
        });
        if (placedCnt !== 2) {
          throw new BadRequestException(
            "Both ports must belong to devices placed on this chart"
          );
        }
      }

      // c) Upsert global Line rows (unique on (sourcePortId, targetPortId))
      //    Seed defaults from DTO overrides; per-chart overrides will live in LOC.
      const linesToUpsert = desired.map((l) => ({
        sourcePortId: l.line.sourcePortId,
        targetPortId: l.line.targetPortId,
        type: l.type,
        label: l.label,
      }));
      if (linesToUpsert.length) {
        await lineRepo.upsert(linesToUpsert, ["sourcePortId", "targetPortId"]);
      }

      // d) Fetch ids to create LineOnChart rows
      const persistedLines = linesToUpsert.length
        ? await lineRepo.find({
            where: {
              sourcePortId: In(linesToUpsert.map((x) => x.sourcePortId)),
              targetPortId: In(linesToUpsert.map((x) => x.targetPortId)),
            },
            select: ["id", "sourcePortId", "targetPortId"],
          })
        : [];
      const lineIdByPair = new Map(
        persistedLines.map((p) => [`${p.sourcePortId}→${p.targetPortId}`, p.id])
      );

      // e) Upsert LineOnChart (unique on (chartId, lineId))
      const locRows = desired.map((l) => ({
        chartId,
        lineId: lineIdByPair.get(`${l.line.sourcePortId}→${l.line.targetPortId}`)!,
        sourcePortId: l.line.sourcePortId,
        targetPortId: l.line.targetPortId,
      }));
      if (locRows.length) {
        await locRepo.upsert(locRows, ["chartId", "lineId"]);
      }

      // f) Remove LineOnChart not present anymore for this chart
      const keep = new Set(locRows.map((r) => `${r.chartId}:${r.lineId}`));
      const existingLOC = await locRepo.find({
        where: { chartId },
        select: ["id", "chartId", "lineId"],
      });
      const toDelete = existingLOC.filter((x) => !keep.has(`${x.chartId}:${x.lineId}`));
      if (toDelete.length) await locRepo.remove(toDelete);
    }

    // ---- 4) Return fresh chart with full relations
    return chartsRepo.findOneOrFail({
      where: { id: chartId },
      relations: {
        devicesOnChart: {
          device: { model: { vendor: true }, ports: true },
          portPlacements: { port: true },
        },
        linesOnChart: { line: true },
      },
    });
  });

  return this.convertChartEntityToChart(updated);
}

  async removeChart(id: string): Promise<void> {
    const chart = await this.chartRepo.findOne({ where: { id } });
    if (!chart) throw new NotFoundException("Chart not found");
    await this.chartRepo.remove(chart); // cascades will clean placements/lines
  }
}
