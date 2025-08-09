import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VendorsController } from './vendors.controller';
import { VendorsService } from './vendors.service';
import { VendorEntity } from './entities/vendor.entity';

@Module({
    imports:[
        TypeOrmModule.forFeature([VendorEntity]),
    ],
    controllers:[VendorsController],
    providers:[VendorsService],
    exports:[VendorsService]
})
export class VendorsModule {}
