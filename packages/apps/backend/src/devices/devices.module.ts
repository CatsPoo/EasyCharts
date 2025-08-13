import { Module } from '@nestjs/common';
import { DevicesController } from './devices.controller';
import { DevicesService } from './devices.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeviceEntity } from './entities/device.entity';
import { VendorsController } from './vendors.controller';
import { VendorsService } from './vendors.service';
import { VendorEntity } from './entities/vendor.entity';
import { ModelsController } from './models.controller';
import { ModelsService } from './model.service';
import { ModelEntity } from './entities/model.entity';

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
