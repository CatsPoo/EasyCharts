import { Module } from '@nestjs/common';
import { LinesController } from './lines.controller';
import { LinessService } from './lines.service';
import { LineEntity } from './entities/line.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PortEntity } from '../devices/entities/port.entity';
import { DevicesModule } from '../devices/devices.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LineEntity,PortEntity]),
    DevicesModule
  ],
  controllers: [LinesController],
  providers: [LinessService],
  exports: [LinessService],
})
export class LinesModule {}
