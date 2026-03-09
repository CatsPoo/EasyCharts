import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { OverlayElementEntity } from '../devices/entities/overlayElement.entity';
import { OverlayElementOnChartEntity } from '../charts/entities/overlayElementOnChart.entity';
import { OverlayElementsController } from './overlayElements.controller';
import { OverlayElementsService } from './overlayElements.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([OverlayElementEntity, OverlayElementOnChartEntity]),
    AuthModule,
  ],
  controllers: [OverlayElementsController],
  providers: [OverlayElementsService],
  exports: [OverlayElementsService],
})
export class OverlayElementsModule {}
