// src/charts/charts.service.ts
import type {
  Chart,
  ChartCreate,
  ChartUpdate,
} from "@Easy-charts/easycharts-types";
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { DeviceEntity } from "../devices/entities/device.entity";
import { ChartEntity } from "./entities/chart.entity";
import { DeviceOnChartEntity } from "./entities/deviceOnChart.entityEntity";

@Injectable()
export class ChartsService {
  constructor(
    private readonly dataSource: DataSource,

    @InjectRepository(ChartEntity)
    private readonly chartRepo: Repository<ChartEntity>,

    @InjectRepository(DeviceEntity)
    private readonly deviceRepo: Repository<DeviceEntity>,

    @InjectRepository(DeviceOnChartEntity)
    private readonly docRepo: Repository<DeviceOnChartEntity>
  ) // @InjectRepository(Line)
  // private readonly lineRepo: Repository<Line>,
  {}

  convertChartEntityToChart = (chartEnrity:ChartEntity) : Chart =>{
    const {devicesLocations, ...chartData} : ChartEntity = chartEnrity 
    return {
      ...chartData,
      devicesLocations
    } as Chart
  }
  async getAllCharts(): Promise<Chart[]> {
    return (await this.chartRepo.find({})).map(
      chartEntity => this.convertChartEntityToChart(chartEntity)
    );
  }

  async getChartById(id: string): Promise<ChartEntity> {
    const chart: ChartEntity | null = await this.chartRepo.findOne({
      where: { id },
    });
    if (!chart) throw new NotFoundException("Vendor not found");
    return chart;
  }

  async createChart(dto: ChartCreate): Promise<Chart> {
    const chart: ChartEntity = this.chartRepo.create({
      ...dto,
    });
    const newChart : ChartEntity =await  this.chartRepo.save(chart);
    return this.convertChartEntityToChart(newChart)
  }

  async updateChart(id: string, dto: ChartUpdate): Promise<Chart> {
    const updatedChart = await this.dataSource.transaction(async (manager) => {
      // 1) Load & update the chart basic fields
      const chart = await manager.findOne(ChartEntity, { where: { id } });
      if (!chart) throw new NotFoundException("Chart not found");

      if (dto.name !== undefined) chart.name = dto.name;
      if (dto.description !== undefined) chart.description = dto.description;
      await manager.save(ChartEntity, chart);

      // 2) Placements
      let deviceIdsOnChart: Set<string>;

      if (dto.devicesLocations) {
        // If placements are replaced, clear dependent lines first (optional but safer)
        //await manager.delete(LineEntity, { chartId: chart.id });

        // Remove old placements
        await manager.delete(DeviceOnChartEntity, { chartId: chart.id });

        // Insert new placements
        const newPlacements: DeviceOnChartEntity[] = [];

        for (const dl of dto.devicesLocations) {
          const device = await manager.findOne(DeviceEntity, {
            where: { id: dl.deviceId },
          });
          if (!device) {
            throw new BadRequestException(
              `Device id ${dl.deviceId} does not exist`
            );
          }

          const placement = manager.create(DeviceOnChartEntity, {
            chartId: chart.id,
            deviceId: device.id,
            position: dl.position,
          });

          newPlacements.push(placement);
        }

        await manager.save(DeviceOnChartEntity, newPlacements);
        deviceIdsOnChart = new Set(newPlacements.map((p) => p.deviceId));
      } else {
        // No placement change → use existing placements for line validation
        const current = await manager.find(DeviceOnChartEntity, {
          where: { chartId: chart.id },
        });
        deviceIdsOnChart = new Set(current.map((c) => c.deviceId));
      }

      // 3) Lines (replace if provided; otherwise leave as-is)
      // if (dto.lines) {
      //   await manager.delete(LineEntity, { chartId: chart.id });

      //   const newLines = dto.lines.map((l) =>
      //     manager.create(LineEntity, {
      //       id: l.id, // optional; DB can generate if undefined
      //       chartId: chart.id,
      //       label: l.label,
      //       type: l.type,
      //       sourceDeviceId: l.sourceDeviceId,
      //       targetDeviceId: l.targetDeviceId,
      //     }),
      //   );

      //   // Validate: both endpoints must exist on this chart
      //   for (const ln of newLines) {
      //     if (!deviceIdsOnChart.has(ln.sourceDeviceId) || !deviceIdsOnChart.has(ln.targetDeviceId)) {
      //       throw new BadRequestException(
      //         `Line connects devices not on this chart: ${ln.sourceDeviceId} -> ${ln.targetDeviceId}`,
      //       );
      //     }
      //   }

      //   await manager.save(LineEntity, newLines);
      // }

      // 4) Return hydrated chart
      return manager.findOneOrFail(ChartEntity, {
        where: { id: chart.id },
        relations: { devicesLocations: { device: true } /*lines: true*/ },
      });
    });

    return this.convertChartEntityToChart(updatedChart);
  }

  async removeChart(id: string): Promise<void> {
    const chart = await this.chartRepo.findOne({ where: { id } });
    if (!chart) throw new NotFoundException("Chart not found");
    await this.chartRepo.remove(chart); // cascades will clean placements/lines
  }
}
