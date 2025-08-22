import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DevicesController } from './devices.controller';
import { DevicesService } from './devices.service';
import { DeviceEntity } from './entities/device.entity';
import { ModelEntity } from './entities/model.entity';
import { VendorEntity } from "./entities/vendor.entity";
import { ModelsService } from './model.service';
import { ModelsController } from './models.controller';
import { VendorsController } from './vendors.controller copy';
import { VendorsService } from './vendors.service copy';
import { PortEntity } from './entities/port.entity';
import { PortsController } from './ports.controller';
import { PortsService } from './ports.service';

@Module({
    imports:[
        TypeOrmModule.forFeature([
            DeviceEntity,
            VendorEntity,
            ModelEntity,
            PortEntity
        ]),
    ],
    controllers:[
        DevicesController,
        VendorsController,
        ModelsController,
        PortsController
    ],
    providers:[
        DevicesService,
        VendorsService,
        ModelsService,
        PortsService
    ],
    exports:[
        DevicesService,
        VendorsService,
        ModelsService,
        PortsService
    ]
})
export class DevicesModule {}
