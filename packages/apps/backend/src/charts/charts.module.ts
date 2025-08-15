import { Module } from '@nestjs/common';
import { ChartsService } from './charts.service';
import { ChartsController } from './charts.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChartEntity } from './entities/chart.entity';
import { DeviceOnChart } from './entities/deviceOnChart.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature(
        [
           ChartEntity,
           DeviceOnChart        
        ])
    ],
    controllers: [ChartsController],
    providers: [ChartsService],
})
export class ChartsModule {}
