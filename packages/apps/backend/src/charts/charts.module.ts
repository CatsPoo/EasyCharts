import { Module } from '@nestjs/common';
import { ChartsService } from './charts.service';
import { ChartsController } from './charts.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChartEntity } from './entities/chart.entity';
import { DeviceOnChartEntity } from "./entities/deviceOnChart.entity";
import { DevicesModule } from '../devices/devices.module';
import { DeviceEntity } from '../devices/entities/device.entity';
import { LineEntity } from '../lines/entities/line.entity';
import { PortEntity } from '../devices/entities/port.entity';
import { LinesModule } from '../lines/lines.module';
import { PortOnChartEntity } from './entities/portOnChart.entity';
import { LineOnChartEntity } from './entities/lineonChart.emtity';
import { AuthModule } from '../auth/auth.module';
import { BondOnChartEntity } from './entities/BondOnChart.emtity';
import { NoteOnChartEntity } from './entities/noteOnChart.entity';
import { ZoneOnChartEntity } from './entities/zoneOnChart.entity';
import { CloudOnChartEntity, CloudConnectionOnChartEntity } from './entities/cloudOnChart.entity';
import { CustomElementOnChartEntity, CustomElementEdgeOnChartEntity } from './entities/customElementOnChart.entity';
import { LinesOnChartService } from './lineOnChart.service';
import { DevicesOnChartService } from './deviceOnChart.service';
import { BondsOnChartService } from './bondOnChart.service';
import { NotesOnChartService } from './noteOnChart.service';
import { ZonesOnChartService } from './zoneOnChart.service';
import { CloudsOnChartService } from './cloudOnChart.service';
import { CustomElementsOnChartService } from './customElementOnChart.service';
import { PortsOnChartService } from './portsOnChart.service';
import { ChartShareEntity } from './entities/chartShare.entity';
import { ChartInDirectoryEntity } from '../chartsDirectories/entities/chartsInDirectory.entity';
import { DirectoryShareEntity } from '../chartsDirectories/entities/directoryShare.entity';
import { ChartVersionEntity } from './entities/chartVersion.entity';
import { ChartVersionsService } from './chartVersions.service';
import { ChartVersionsController } from './chartVersions.controller';
import { ChartShareGuard } from './guards/chartShare.guard';

@Module({
    imports: [
        TypeOrmModule.forFeature(
        [
           ChartEntity,
           DeviceOnChartEntity,
           DeviceEntity,
           LineEntity,
           PortEntity,
           PortOnChartEntity,
           LineOnChartEntity,
           BondOnChartEntity,
           NoteOnChartEntity,
           ZoneOnChartEntity,
           CloudOnChartEntity,
           CloudConnectionOnChartEntity,
           CustomElementOnChartEntity,
           CustomElementEdgeOnChartEntity,
           ChartShareEntity,
           ChartInDirectoryEntity,
           DirectoryShareEntity,
           ChartVersionEntity,
        ]),
        DevicesModule,
        LinesModule,
        AuthModule
    ],
    controllers: [ChartsController, ChartVersionsController],
    providers: [ChartsService,LinesOnChartService,DevicesOnChartService,BondsOnChartService,NotesOnChartService,ZonesOnChartService,CloudsOnChartService,PortsOnChartService,ChartVersionsService,ChartShareGuard,CustomElementsOnChartService],
    exports:[ChartsService]
})
export class ChartsModule {}
