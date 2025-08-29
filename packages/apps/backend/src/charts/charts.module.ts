import { Module } from '@nestjs/common';
import { ChartsService } from './charts.service';
import { ChartsController } from './charts.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChartEntity } from './entities/chart.entity';
import { DeviceOnChartEntity } from "./entities/deviceOnChart.entityEntity";
import { DevicesModule } from '../devices/devices.module';
import { DeviceEntity } from '../devices/entities/device.entity';
import { LineEntity } from '../lines/entities/line.entity';
import { PortEntity } from '../devices/entities/port.entity';
import { LinesModule } from '../lines/lines.module';
import { PortOnChartEntity } from './entities/portOnChart.entity';
import { LineOnChartEntity } from './entities/lineonChart.emtity';

@Module({
    imports: [
        TypeOrmModule.forFeature(
        [
           ChartEntity,
           DeviceOnChartEntity,
           DeviceEntity,
           LineEntity,
           PortEntity,
           PortOnChartEntity,
           LineOnChartEntity       
        ]),
        DevicesModule,
        LinesModule
    ],
    controllers: [ChartsController],
    providers: [ChartsService],
    exports:[ChartsService]
})
export class ChartsModule {}
