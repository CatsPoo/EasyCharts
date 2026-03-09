import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetVersionEntity } from './entities/assetVersion.entity';
import { AssetVersionsService } from './assetVersions.service';
import { AssetVersionsController } from './assetVersions.controller';
import { DevicesModule } from '../devices/devices.module';
import { OverlayElementsModule } from '../overlayElements/overlayElements.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AssetVersionEntity]),
    forwardRef(() => DevicesModule),
    OverlayElementsModule,
    AuthModule,
  ],
  controllers: [AssetVersionsController],
  providers: [AssetVersionsService],
  exports: [AssetVersionsService],
})
export class AssetVersionsModule {}
