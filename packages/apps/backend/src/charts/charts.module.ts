import { Module } from '@nestjs/common';
import { ChartsService } from './charts.service';
import { ChartsController } from './charts.controller';

@Module({
    imports: [],
    controllers: [ChartsController],
    providers: [ChartsService],
})
export class ChartsModule {}
