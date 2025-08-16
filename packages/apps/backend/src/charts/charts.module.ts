import { Module } from '@nestjs/common';
import { ChartsService } from './charts.service';
import { ChartsController } from './charts.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChartEntity } from './entities/chart.entity';
import { DeviceOnChartEntity } from "./entities/deviceOnChart.entityEntity";

@Module({
    imports: [
        TypeOrmModule.forFeature(
        [
           ChartEntity,
           DeviceOnChartEntity       
        ])
    ],
    controllers: [ChartsController],
    providers: [ChartsService],
})
export class ChartsModule {}
