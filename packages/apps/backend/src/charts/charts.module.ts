import { Module } from '@nestjs/common';
import { ChartsService } from './charts.service';
import { ChartsController } from './charts.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChartEntity } from './entities/chart.entity';
import { DeviceOnChartEntity } from "./entities/deviceOnChart.entityEntity";
import { DevicesModule } from '../devices/devices.module';
import { DeviceEntity } from '../devices/entities/device.entity';
import { LineEntity } from './entities/line.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature(
        [
           ChartEntity,
           DeviceOnChartEntity,
           DeviceEntity,
           LineEntity       
        ]),
        DevicesModule,
    ],
    controllers: [ChartsController],
    providers: [ChartsService],
    exports:[ChartsService]
})
export class ChartsModule {}
