import { Module } from '@nestjs/common';
import { LinesController } from './lines.controller';
import { LinessService } from './lines.service';
import { LineEntity } from './entities/line.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PortEntity } from '../devices/entities/port.entity';
import { AuthModule } from '../auth/auth.module';
import { DevicesModule } from '../devices/devices.module';
import { DeviceEntity } from '../devices/entities/device.entity';
import { BondEntity } from './entities/bond.entity';
import { PortTypeEntity } from './entities/portType.entity';
import { CableTypeEntity } from './entities/cableType.entity';
import { PortTypesService } from './portTypes.service';
import { CableTypesService } from './cableTypes.service';
import { PortTypesController } from './portTypes.controller';
import { CableTypesController } from './cableTypes.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([LineEntity, PortEntity, DeviceEntity, BondEntity, PortTypeEntity, CableTypeEntity]),
    AuthModule,
    DevicesModule,
  ],
  controllers: [LinesController, PortTypesController, CableTypesController],
  providers: [LinessService, PortTypesService, CableTypesService],
  exports: [LinessService, PortTypesService, CableTypesService],
})
export class LinesModule {}
