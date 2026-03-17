import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { ChartsModule } from '../charts/charts.module';
import { ChartEntity } from '../charts/entities/chart.entity';
import { ChartShareEntity } from '../charts/entities/chartShare.entity';
import { GroupChartShareEntity } from '../charts/entities/groupChartShare.entity';
import { GroupMembershipEntity } from '../groups/entities/groupMembership.entity';
import { ChartsDirectoriesController } from './chartsDirectories.controller';
import { ChartsDirectoriesService } from './chartsDirectories.service';
import { ChartsInDirectoriesController } from './chartsInDirectories.controller';
import { ChartsDirectoryEntity } from './entities/chartsDirectory.entity';
import { ChartInDirectoryEntity } from './entities/chartsInDirectory.entity';
import { DirectoryShareEntity } from './entities/directoryShare.entity';
import { GroupDirectoryShareEntity } from './entities/groupDirectoryShare.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ChartsDirectoryEntity,
      ChartInDirectoryEntity,
      DirectoryShareEntity,
      GroupDirectoryShareEntity,
      ChartEntity,
      ChartShareEntity,
      GroupChartShareEntity,
      GroupMembershipEntity,
    ]),
    AuthModule,
    ChartsModule,
  ],
  controllers: [ChartsDirectoriesController, ChartsInDirectoriesController],
  providers: [ChartsDirectoriesService],
  exports: [ChartsDirectoriesService],
})
export class ChartsDirectoriesModule {}
