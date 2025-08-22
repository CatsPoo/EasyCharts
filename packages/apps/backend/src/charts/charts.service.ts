// src/charts/charts.service.ts
import type {
  Chart,
  ChartCreate,
  ChartMetadata,
  ChartUpdate,
  Device,
  DeviceOnChart,
  Line,
} from "@Easy-charts/easycharts-types";
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, In, Repository } from "typeorm";
import { ChartEntity } from "./entities/chart.entity";
import { DeviceOnChartEntity } from "./entities/deviceOnChart.entityEntity";
import { LineEntity } from "../lines/entities/line.entity";
import { DevicesService } from "../devices/devices.service";
import { DeviceEntity } from "../devices/entities/device.entity";
@Injectable()
export class ChartsService {
  constructor(
    private readonly dataSource: DataSource,

    @InjectRepository(ChartEntity)
    private readonly chartRepo: Repository<ChartEntity>,

    @InjectRepository(DeviceOnChartEntity)
    private readonly docRepo: Repository<DeviceOnChartEntity>,

    @InjectRepository(LineEntity)
    private readonly lineRepo: Repository<LineEntity>,

    private readonly devicesService: DevicesService
  ) {}

  convertDeviceOnChartEntity = (
    deviceonChartEntity: DeviceOnChartEntity
  ): DeviceOnChart => {
    const { chartId, position, device } = deviceonChartEntity;
    return {
      chartId,
      device: this.devicesService.convertDeviceEntity(device),
      position,
    };
  };

  //TODO all lines to convertion function
  convertChartEntityToChart = (chartEnrity: ChartEntity): Chart => {
    const { devicesLocations, lines, ...chartData } = chartEnrity;
    return {
      devicesLocations: devicesLocations.map((dl) =>
        this.convertDeviceOnChartEntity(dl)
      ),
      ...chartData,
    } as Chart;
  };
  async getAllCharts(): Promise<Chart[]> {
    return (await this.chartRepo.find({})).map((chartEntity) =>
      this.convertChartEntityToChart(chartEntity)
    );
  }

  async getChartById(id: string): Promise<Chart> {
    const chart: ChartEntity | null = await this.chartRepo.findOne({
      where: { id },
      relations: {
        devicesLocations:{
          device:{
            model:{
              vendor:true
            }
          },
          position:true
        },
        lines:{
          sourceDevice:{
            model:{
              vendor:true
            }
          },
          targetDevice:{
            model:{
              vendor:true
            }
          }
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
      devicesLocations: dto.devicesLocations.map((dl) => ({
        deviceId: dl.device.id,
        position: dl.position,
      })),
      lines: [],
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
    const updatedchartentity: ChartEntity = await this.dataSource.transaction(
      async (manager) => {
        const chartsRepo = manager.getRepository(ChartEntity);
        const docRepo = manager.getRepository(DeviceOnChartEntity);
        const lineRepo = manager.getRepository(LineEntity);
        const deviceRepo = manager.getRepository(DeviceEntity);
        const chart = await chartsRepo.findOne({
          where: { id: chartId },
          relations: {
            devicesLocations: { device: true }, // <-- critical change
            lines: true,
          },
        });
        if (!chart) throw new NotFoundException(`Chart ${chartId} not found`);

        // ---- Scalars ---------------------------------------------------------
        if (dto.name !== undefined) chart.name = dto.name;
        if (dto.description !== undefined)
          chart.description = dto.description ?? "";
        await chartsRepo.save(chart);

        // ---- Devices on chart (placements) ----------------------------------
        // Only touch if provided; if omitted, keep as-is
        if (dto.devicesLocations !== undefined) {
          const placements = dto.devicesLocations;

          if (!placements.length) {
            // Client sent an empty array => remove all placements for this chart
            await docRepo.delete({ chartId });
          } else {
            // Validate devices exist
            const uniqDeviceIds = [
              ...new Set(placements.map((d) => d.device.id)),
            ];
            const existingCount = await deviceRepo.count({
              where: { id: In(uniqDeviceIds) },
            });
            if (existingCount !== uniqDeviceIds.length) {
              throw new BadRequestException("One or more devices do not exist");
            }

            // Save (insert or update) each (chartId, deviceId) row
            for (const d of placements) {
              await docRepo.save({
                chartId,
                deviceId: d.device.id,
                position: d.position,
              });
            }

            // Remove rows no longer present
            const desiredDeviceIds = new Set(
              placements.map((d) => d.device.id)
            );
            const existingDocs = await docRepo.find({ where: { chartId } });
            const toRemove = existingDocs.filter(
              (e) => !desiredDeviceIds.has(e.deviceId)
            );
            if (toRemove.length) {
              await docRepo.remove(toRemove);
            }
          }
        }

        // ---- Lines -----------------------------------------------------------
        // Only touch if provided; if omitted, keep as-is
        if (dto.lines !== undefined) {
          const incoming = dto.lines ?? [];

          if (!incoming.length) {
            // Client sent empty array => remove all lines for this chart
            await lineRepo
              .createQueryBuilder()
              .delete()
              .where("chart_id = :chartId", { chartId })
              .execute();
          } else {
            // Validate endpoints exist
            const endpointIds = new Set<string>();
            for (const l of incoming) {
              endpointIds.add(l.sourceDeviceId);
              endpointIds.add(l.targetDeviceId);
            }
            if (endpointIds.size) {
              const endpointsCount = await deviceRepo.count({
                where: { id: In(Array.from(endpointIds)) },
              });
              if (endpointsCount !== endpointIds.size) {
                throw new BadRequestException(
                  "One or more line endpoints reference non-existing devices"
                );
              }
            }

            // Delete lines not included in payload (keep those with same id)
            const incomingIds = new Set(
              incoming.filter((l) => !!l.id).map((l) => l.id!)
            );

            if (incomingIds.size) {
              await lineRepo
                .createQueryBuilder()
                .delete()
                .where("chart_id = :chartId", { chartId })
                .andWhere("id NOT IN (:...ids)", {
                  ids: Array.from(incomingIds),
                })
                .execute();
            } else {
              // No IDs supplied => replace all lines for this chart
              await lineRepo
                .createQueryBuilder()
                .delete()
                .where("chart_id = :chartId", { chartId })
                .execute();
            }

            // Save each line (id present => update; id missing => insert)
            for (const l of incoming) {
              const line = lineRepo.create({
                id: l.id, // undefined inserts
                chart: { id: chartId } as ChartEntity,
                sourceDevice: { id: l.sourceDeviceId } as DeviceEntity,
                targetDevice: { id: l.targetDeviceId } as DeviceEntity,
                type: l.type,
                label: l.label ?? null,
              });
              await lineRepo.save(line);
            }
          }
        }

        // Return a fresh snapshot (include device objects for convenience)
        return chartsRepo.findOneOrFail({
          where: { id: chartId },
          relations: {
            devicesLocations: {
              device: {
                model: {
                  vendor: true,
                },
              },
            },
            lines: {
              sourceDevice: { model: { vendor: true } },
              targetDevice: { model: { vendor: true } },
            },
          },
        });
      }
    );

    return this.convertChartEntityToChart(updatedchartentity);
  }

  async removeChart(id: string): Promise<void> {
    const chart = await this.chartRepo.findOne({ where: { id } });
    if (!chart) throw new NotFoundException("Chart not found");
    await this.chartRepo.remove(chart); // cascades will clean placements/lines
  }
}
