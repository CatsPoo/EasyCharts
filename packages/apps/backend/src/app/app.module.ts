import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DevicesModule } from '../devices/devices.module';
import { LinesModule } from '../lines/lines.module';
import { ChartsModule } from '../charts/charts.module';

@Module({
  imports: [DevicesModule,LinesModule,ChartsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
