import { Module } from '@nestjs/common';
import { DevicesController } from './devices.controller';
import { DevicesService } from './devices.service';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
    imports:[
        TypeOrmModule.forFeature([]),
    ],
    controllers:[DevicesController],
    providers:[DevicesService]
})
export class DevicesModule {}
