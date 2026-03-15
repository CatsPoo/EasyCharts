import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ModelEntity } from './entities/model.entity';
import { VendorEntity } from '../vendors/entities/vendor.entity';
import { AssetVersionEntity } from '../assetVersions/entities/assetVersion.entity';
import { ModelsService } from './model.service';
import { ModelsController } from './models.controller';
import { ModelSeeder } from './model.seeder';
import { AssetVersionsService } from '../assetVersions/assetVersions.service';
import { AuthModule } from '../auth/auth.module';
import { VendorsModule } from '../vendors/vendors.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ModelEntity, VendorEntity, AssetVersionEntity]),
    AuthModule,
    VendorsModule,
  ],
  controllers: [ModelsController],
  providers: [ModelsService, ModelSeeder, AssetVersionsService],
  exports: [ModelsService],
})
export class ModelsModule {}
