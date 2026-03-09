import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VendorEntity } from './entities/vendor.entity';
import { AssetVersionEntity } from '../assetVersions/entities/assetVersion.entity';
import { VendorsService } from './vendors.service';
import { VendorsController } from './vendors.controller';
import { VendorSeeder } from './vendor.seeder';
import { AssetVersionsService } from '../assetVersions/assetVersions.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([VendorEntity, AssetVersionEntity]),
    AuthModule,
  ],
  controllers: [VendorsController],
  providers: [VendorsService, VendorSeeder, AssetVersionsService],
  exports: [VendorsService],
})
export class VendorsModule {}
