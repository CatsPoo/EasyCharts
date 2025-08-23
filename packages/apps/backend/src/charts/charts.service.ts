// src/charts/charts.service.ts
import {
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
@Injectable()
export class ChartsService {
  constructor(
    private readonly dataSource: DataSource,

    @InjectRepository(ChartEntity)
    private readonly chartRepo: Repository<ChartEntity>,

    private readonly devicesService: DevicesService
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
      rows.push({ chartId, deviceId, portId: p.id, side });
    });
  });
  return rows;
}

 rowsToHandles(placements: PortOnChartEntity[]) :Handles{
  const bySide: Record<Side, Port[]> = { left: [], right: [], top: [], bottom: [] };
  for (const r of placements) {
    bySide[r.side].push(this.convertPortEntityToPort(r.port))
  }
  return bySide;
}

  convertDeviceOnChartEntity = async (
    deviceonChartEntity: DeviceOnChartEntity
  ): Promise<DeviceOnChart> => {
    const { chartId, position, device } = deviceonChartEntity;
    return {
      chartId,
      device: this.devicesService.convertDeviceEntity(device),
      position,
      handles: this.rowsToHandles(deviceonChartEntity.portPlacements ?? []) 
    } as DeviceOnChart;
  };



  //TODO all lines to convertion function
  convertChartEntityToChart = async (chartEnrity: ChartEntity): Promise<Chart> => {
    const { devicesLocations, ...chartData } = chartEnrity;
    let convertedDevicesLocations : DeviceOnChart[] = []
    for(const dl of devicesLocations){
      convertedDevicesLocations.push(await this.convertDeviceOnChartEntity(dl)); 
    }
    return {
      devicesLocations: convertedDevicesLocations,
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
        devicesLocations:{
          device: {
             model: {
               vendor: true 
              },
              ports: true 
            },
          portPlacements: {
             port: true 
            },
          position:true
        },
      },
    });
    if (!chart) throw new NotFoundException("chart not found");
    return await this.convertChartEntityToChart(chart);
  }

  //TODO Add lines to create dto
  async createChart(dto: ChartCreate): Promise<Chart> {
    const chart: ChartEntity = this.chartRepo.create({
      name: dto.name,
      devicesLocations: dto.devicesLocations.map((dl) => ({
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

    const chart = await chartsRepo.findOne({
      where: { id: chartId },
      relations: { devicesLocations: true },
    });
    if (!chart) throw new NotFoundException(`Chart ${chartId} not found`);

    if (dto.name !== undefined) chart.name = dto.name;
    if (dto.description !== undefined) chart.description = dto.description ?? "";
    await chartsRepo.save(chart);

    if (dto.devicesLocations !== undefined) {
      const placements = dto.devicesLocations;
      const uniqDeviceIds = [...new Set(placements.map(d => d.device.id))];
      if (uniqDeviceIds.length) {
        const count = await deviceRepo.count({ where: { id: In(uniqDeviceIds) } });
        if (count !== uniqDeviceIds.length) {
          throw new BadRequestException("One or more devices do not exist");
        }
      }

      for (const d of placements) {
        await docRepo.save({ chartId, deviceId: d.device.id, position: d.position });
      }

      const desiredIds = new Set(placements.map(d => d.device.id));
      const existingDocs = await docRepo.find({ where: { chartId } });
      const toRemove = existingDocs.filter(e => !desiredIds.has(e.deviceId));
      if (toRemove.length) await docRepo.remove(toRemove);

      for (const d of placements) {
        if (!("handles" in d) || d.handles == null) continue;

        const desiredRows = this.handlesToRows(chartId, d.device.id, d.handles);
        if (desiredRows.length) {
          const distinctPortIds = [...new Set(desiredRows.map(r => r.portId))];
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

    return chartsRepo.findOneOrFail({
      where: { id: chartId },
      relations: {
        devicesLocations: {
          device: { model: { vendor: true }, ports: true },
          portPlacements: { port: true },
        },
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
