import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ModelEntity } from './entities/model.entity';
import { VendorEntity } from '../vendors/entities/vendor.entity';
import { AssetVersionEntity } from '../devices/entities/assetVersion.entity';
import { ModelsService } from './model.service';
import { ModelsController } from './models.controller';
import { ModelSeeder } from './model.seeder';
import { AssetVersionsService } from '../devices/assetVersions.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ModelEntity, VendorEntity, AssetVersionEntity]),
    AuthModule,
  ],
  controllers: [ModelsController],
  providers: [ModelsService, ModelSeeder, AssetVersionsService],
  exports: [ModelsService],
})
export class ModelsModule {}
