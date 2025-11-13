import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { ChartsDirectoryEntity } from './entities/chartsDirectory.entity';
import { ChartsDirectoriesController } from './chartsDirectories.controller';
import { ChartsDirectoriesService } from './chartsDirectories.service';
import { ChartsInDirectoriesController } from './chartsInDirectories.controller';
import { ChartInDirectoryEntity } from './entities/chartsInDirectory.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChartsDirectoryEntity, ChartInDirectoryEntity]),
    AuthModule,
  ],
  controllers: [ChartsDirectoriesController, ChartsInDirectoriesController],
  providers: [ChartsDirectoriesService],
  exports: [],
})
export class ChartsDirectoriesModule {}
