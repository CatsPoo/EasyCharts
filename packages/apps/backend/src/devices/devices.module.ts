import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DevicesController } from './devices.controller';
import { DevicesService } from './devices.service';
import { DeviceEntity } from './entities/device.entity';
import { ModelEntity } from './entities/model.entity';
import { VendorEntity } from "./entities/vendor.entity";
import { ModelsService } from './model.service';
import { ModelsController } from './models.controller';
import { VendorsController } from './vendors.controller';
import { VendorsService } from './vendors.service';
import { PortEntity } from './entities/port.entity';
import { PortsController } from './ports.controller';
import { PortsService } from './ports.service';
import { AuthModule } from '../auth/auth.module';
import { DeviceTypeEntity } from './entities/deviceType.entity';
import { DeviceTypeController } from './deviceType.controller';
import { DeviceTypeService } from './deviceType.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DeviceEntity,
      VendorEntity,
      ModelEntity,
      PortEntity,
      DeviceTypeEntity,
    ]),
    AuthModule,
  ],
  controllers: [
    DevicesController,
    VendorsController,
    ModelsController,
    PortsController,
    DeviceTypeController,
  ],
  providers: [DevicesService, VendorsService, ModelsService, PortsService, DeviceTypeService],
  exports: [DevicesService, VendorsService, ModelsService, PortsService, DeviceTypeService],
})
export class DevicesModule {}
