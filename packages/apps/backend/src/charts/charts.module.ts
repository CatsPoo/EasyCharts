import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { ChartInDirectoryEntity } from '../chartsDirectories/entities/chartsInDirectory.entity';
import { DirectoryShareEntity } from '../chartsDirectories/entities/directoryShare.entity';
import { DevicesModule } from '../devices/devices.module';
import { DeviceEntity } from '../devices/entities/device.entity';
import { PortEntity } from '../devices/entities/port.entity';
import { LineEntity } from '../lines/entities/line.entity';
import { LinesModule } from '../lines/lines.module';
import { BondsOnChartService } from './bondOnChart.service';
import { ChartsController } from './charts.controller';
import { ChartsService } from './charts.service';
import { ChartVersionsController } from './chartVersions.controller';
import { ChartVersionsService } from './chartVersions.service';
import { CloudsOnChartService } from './cloudOnChart.service';
import { DevicesOnChartService } from './deviceOnChart.service';
import { BondOnChartEntity } from './entities/BondOnChart.emtity';
import { ChartEntity } from './entities/chart.entity';
import { ChartShareEntity } from './entities/chartShare.entity';
import { ChartVersionEntity } from './entities/chartVersion.entity';
import { CloudConnectionOnChartEntity, CloudOnChartEntity } from './entities/cloudOnChart.entity';
import { DeviceOnChartEntity } from "./entities/deviceOnChart.entity";
import { LineOnChartEntity } from './entities/lineonChart.emtity';
import { NoteOnChartEntity } from './entities/noteOnChart.entity';
import { PortOnChartEntity } from './entities/portOnChart.entity';
import { ZoneOnChartEntity } from './entities/zoneOnChart.entity';
import { ChartShareGuard } from './guards/chartShare.guard';
import { LinesOnChartService } from './lineOnChart.service';
import { NotesOnChartService } from './noteOnChart.service';
import { PortsOnChartService } from './portsOnChart.service';
import { ZonesOnChartService } from './zoneOnChart.service';
import { CustomElementsOnChartService } from './customElementOnChart.service';
import { CustomElementOnChartEntity, CustomElementEdgeOnChartEntity } from './entities/customElementOnChart.entity';

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
           ChartShareEntity,
           ChartInDirectoryEntity,
           DirectoryShareEntity,
           ChartVersionEntity,
           CustomElementOnChartEntity,
           CustomElementEdgeOnChartEntity,
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
