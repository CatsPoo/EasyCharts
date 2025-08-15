// src/charts/charts.service.ts
import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { type CreateChartDto, type UpdateChartDto } from '@Easy-charts/easycharts-types';
import { ChartEntity } from './entities/chart.entity';
import { DeviceEntity } from '../devices/entities/device.entity';
import { DeviceOnChartEntity } from './entities/deviceOnChart.entityEntity';

@Injectable()
export class ChartsService {
  constructor(
    private readonly dataSource: DataSource,

    @InjectRepository(ChartEntity)
    private readonly chartRepo: Repository<ChartEntity>,

    // @InjectRepository(DeviceEntity)
    // private readonly deviceRepo: Repository<DeviceEntity>,

    // @InjectRepository(DeviceOnChartEntity)
    // private readonly docRepo: Repository<DeviceOnChartEntity>,

    // @InjectRepository(Line)
    // private readonly lineRepo: Repository<Line>,
  ) {}

  async getAllCharts():Promise<ChartEntity[]>{
    return this.chartRepo.find({});
  }

  async getChartById(id: string):Promise<ChartEntity>{
    const chart : ChartEntity | null = await this.chartRepo.findOne({ where: { id } });
    if (!chart) throw new NotFoundException('Vendor not found');
    return chart;
  }

  async createEmptyChart(dto: CreateChartDto) {
    const chart : ChartEntity = this.chartRepo.create({
      ...dto,
    });
    return this.chartRepo.save(chart);
  }

//  async update(id: string, dto: UpdateChartDto) {
//     return this.dataSource.transaction(async (manager) => {
//       const chart = await manager.findOne(Chart, { where: { id } });
//       if (!chart) throw new NotFoundException('Chart not found');

//       // update basic fields
//       if (dto.name !== undefined) chart.name = dto.name;
//       if (dto.description !== undefined) chart.description = dto.description;
//       await manager.save(chart);

//       // If placements are provided, replace them
//       let deviceIdsOnChart = new Set<string>();
//       if (dto.devicesLocations) {
//         // clear old placements and lines (lines depend on placements)
//         await manager.delete(Line, { chartId: chart.id });
//         await manager.delete(DeviceOnChart, { chartId: chart.id });

//         const newPlacements: DeviceOnChart[] = [];
//         deviceIdsOnChart = new Set<string>();

//         for (const dl of dto.devicesLocations) {
//           let device: Device | null = null;

//           if (dl.device.id) {
//             device = await manager.findOne(Device, { where: { id: dl.device.id } });
//             if (!device)
//               throw new BadRequestException(`Device id ${dl.device.id} does not exist`);
//           } else {
//             if (!dl.device.name || !dl.device.type) {
//               throw new BadRequestException(
//                 'When device.id is missing, device.name and device.type are required',
//               );
//             }
//             device = manager.create(Device, {
//               name: dl.device.name,
//               type: dl.device.type,
//             });
//             await manager.save(device);
//           }

//           const doc = manager.create(DeviceOnChart, {
//             chartId: chart.id,
//             deviceId: device.id,
//             chart,
//             device,
//             position: { x: dl.position.x, y: dl.position.y },
//           });

//           newPlacements.push(doc);
//           deviceIdsOnChart.add(device.id);
//         }
//         await manager.save(newPlacements);
//       } else {
//         // no placements change → use current set for line validation
//         const current = await manager.find( DeviceOnChart, { where: { chartId: chart.id } } );
//         deviceIdsOnChart = new Set(current.map((c) => c.deviceId));
//       }

//       // If lines are provided, replace them
//       if (dto.lines) {
//         await manager.delete(Line, { chartId: chart.id });

//         const newLines: Line[] = [];
//         for (const l of dto.lines) {
//           if (!deviceIdsOnChart.has(l.sourceDeviceId) || !deviceIdsOnChart.has(l.targetDeviceId)) {
//             throw new BadRequestException(
//               `Line connects devices that are not on this chart: ${l.sourceDeviceId} -> ${l.targetDeviceId}`,
//             );
//           }
//           newLines.push(
//             manager.create(Line, {
//               id: l.id,
//               chart,
//               chartId: chart.id,
//               label: l.label,
//               type: l.type,
//               sourceDeviceId: l.sourceDeviceId,
//               targetDeviceId: l.targetDeviceId,
//             }),
//           );
//         }
//         await manager.save(newLines);
//       }

//       return manager.findOneOrFail(Chart, {
//         where: { id: chart.id },
//         relations: { devices: { device: true }, lines: true },
//       });
//     });
//   }

  async removeChart(id: string) : Promise<void> {
    const chart = await this.chartRepo.findOne({ where: { id } });
    if (!chart) throw new NotFoundException('Chart not found');
    await this.chartRepo.remove(chart); // cascades will clean placements/lines
  }
}
