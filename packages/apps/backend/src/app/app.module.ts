import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DevicesModule } from '../devices/devices.module';
import { LinesModule } from '../lines/lines.module';
import { ChartsModule } from "../charts/charts.module";
import { AppConfigModule } from '../appConfig/appConfig.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppConfigService } from '../appConfig/appConfig.service';
import { AuthModule } from '../auth/auth.module';
import { FilesModule } from '../files/files.module';

@Module({
  imports: [
    DevicesModule,
    LinesModule,
    ChartsModule,
    AppConfigModule,
    AuthModule,
    FilesModule,
    TypeOrmModule.forRootAsync({
      imports: [AppConfigModule],
      inject:  [AppConfigService],
      useFactory: (configService: AppConfigService) => ({
        type:        'postgres',
        host:        configService.getConfig().database.host,
        port:        configService.getConfig().database.port,
        username:    configService.getConfig().database.username,
        password:    configService.getConfig().database.password,
        database:    configService.getConfig().database.database_name,

        logging: ['error', 'warn'],
        autoLoadEntities: true,
        synchronize: true,
      }),
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
