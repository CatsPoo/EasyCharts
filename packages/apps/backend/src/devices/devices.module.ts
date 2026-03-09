import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DevicesController } from './devices.controller';
import { DevicesService } from './devices.service';
import { DeviceEntity } from './entities/device.entity';
import { PortEntity } from './entities/port.entity';
import { ModelEntity } from '../models/entities/model.entity';
import { PortsController } from './ports.controller';
import { PortsService } from './ports.service';
import { AuthModule } from '../auth/auth.module';
import { DeviceTypeEntity } from './entities/deviceType.entity';
import { DeviceTypeController } from './deviceType.controller';
import { DeviceTypeService } from './deviceType.service';
import { DeviceTypeSeeder } from './deviceType.seeder';
import { OverlayElementsModule } from '../overlayElements/overlayElements.module';
import { ModelsModule } from '../models/models.module';
import { VendorsModule } from '../vendors/vendors.module';
import { AssetVersionsModule } from '../assetVersions/assetVersions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DeviceEntity,
      ModelEntity,
      PortEntity,
      DeviceTypeEntity,
    ]),
    AuthModule,
    OverlayElementsModule,
    ModelsModule,
    VendorsModule,
    forwardRef(() => AssetVersionsModule),
  ],
  controllers: [
    DevicesController,
    PortsController,
    DeviceTypeController,
  ],
  providers: [DevicesService, PortsService, DeviceTypeService, DeviceTypeSeeder],
  exports: [DevicesService, PortsService, DeviceTypeService, ModelsModule, VendorsModule, AssetVersionsModule],
})
export class DevicesModule {}
