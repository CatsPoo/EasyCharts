import { Module } from "@nestjs/common";
import { AppConfigModule } from "../appConfig/appConfig.module";
import { AuthModule } from "../auth/auth.module";
import { ChartsModule } from "../charts/charts.module";
import { ChartsDirectoriesModule } from "../chartsDirectories/chartsDirectories.module";
import { DevicesModule } from "../devices/devices.module";
import { AiController } from "./ai.controller";
import { AiService } from "./ai.service";

@Module({
  imports: [
    AppConfigModule,
    AuthModule,
    ChartsModule,
    ChartsDirectoriesModule,
    DevicesModule,
  ],
  controllers: [AiController],
  providers: [AiService],
})
export class AiModule {}
