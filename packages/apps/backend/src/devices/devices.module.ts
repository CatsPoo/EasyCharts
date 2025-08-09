import { Module } from '@nestjs/common';
import { DevicesController } from './devices.controller';
import { DevicesService } from './devices.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeviceEntity } from './entities/device.entity';
import { VendorsController } from './vendors.controller';
import { VendorsService } from './vendors.service';
import { VendorEntity } from './entities/vendor.entity';

@Module({
    imports:[
        TypeOrmModule.forFeature([DeviceEntity,VendorEntity]),
    ],
    controllers:[
        DevicesController,
        VendorsController
    ],
    providers:[
        DevicesService,
        VendorsService
    ],
    exports:[
        DevicesService,
        VendorsService
    ]
})
export class DevicesModule {}
