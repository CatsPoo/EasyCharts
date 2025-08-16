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

@Module({
    imports:[
        TypeOrmModule.forFeature([
            DeviceEntity,
            VendorEntity,
            ModelEntity
        ]),
    ],
    controllers:[
        DevicesController,
        VendorsController,
        ModelsController
    ],
    providers:[
        DevicesService,
        VendorsService,
        ModelsService
    ],
    exports:[
        DevicesService,
        VendorsService,
        ModelsService
    ]
})
export class DevicesModule {}
