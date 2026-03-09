import { Module } from '@nestjs/common';
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
import { AssetVersionEntity } from './entities/assetVersion.entity';
import { AssetVersionsService } from './assetVersions.service';
import { AssetVersionsController } from './assetVersions.controller';
import { OverlayElementsModule } from '../overlayElements/overlayElements.module';
import { ModelsModule } from '../models/models.module';
import { VendorsModule } from '../vendors/vendors.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DeviceEntity,
      ModelEntity,
      PortEntity,
      DeviceTypeEntity,
      AssetVersionEntity,
    ]),
    AuthModule,
    OverlayElementsModule,
    ModelsModule,
    VendorsModule,
  ],
  controllers: [
    DevicesController,
    PortsController,
    DeviceTypeController,
    AssetVersionsController,
  ],
  providers: [DevicesService, PortsService, DeviceTypeService, AssetVersionsService],
  exports: [DevicesService, PortsService, DeviceTypeService, AssetVersionsService, ModelsModule, VendorsModule],
})
export class DevicesModule {}
