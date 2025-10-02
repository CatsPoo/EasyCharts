import { Module } from '@nestjs/common';
import { LinesController } from './lines.controller';
import { LinessService } from './lines.service';
import { LineEntity } from './entities/line.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PortEntity } from '../devices/entities/port.entity';
import { DevicesModule } from '../devices/devices.module';
import { DeviceEntity } from '../devices/entities/device.entity';
import { BondEntity } from './entities/bond.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([LineEntity,PortEntity,DeviceEntity,BondEntity]),
    DevicesModule
  ],
  controllers: [LinesController],
  providers: [LinessService],
  exports: [LinessService],
})
export class LinesModule {}
