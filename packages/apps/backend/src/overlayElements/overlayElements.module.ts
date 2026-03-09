import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { OverlayElementEntity } from './entities/overlayElement.entity';
import { OverlayElementOnChartEntity } from '../charts/entities/overlayElementOnChart.entity';
import { OverlayElementsController } from './overlayElements.controller';
import { OverlayElementsService } from './overlayElements.service';
import { OverlayElementsSeeder } from './overlayElements.seeder';

@Module({
  imports: [
    TypeOrmModule.forFeature([OverlayElementEntity, OverlayElementOnChartEntity]),
    AuthModule,
  ],
  controllers: [OverlayElementsController],
  providers: [OverlayElementsService, OverlayElementsSeeder],
  exports: [OverlayElementsService],
})
export class OverlayElementsModule {}
