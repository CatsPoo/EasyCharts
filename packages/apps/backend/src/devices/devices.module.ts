import { Module } from '@nestjs/common';
import { DevicesController } from './devices.controller';
import { DevicesService } from './devices.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeviceEntity } from './entities/device.entity';

@Module({
    imports:[
        TypeOrmModule.forFeature([DeviceEntity]),
    ],
    controllers:[DevicesController],
    providers:[DevicesService],
    exports:[DevicesService]
})
export class DevicesModule {}
