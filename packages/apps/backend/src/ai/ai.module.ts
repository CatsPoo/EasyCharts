import { Module } from "@nestjs/common";
import { AppConfigModule } from "../appConfig/appConfig.module";
import { ChartsModule } from "../charts/charts.module";
import { DevicesModule } from "../devices/devices.module";
import { AiController } from "./ai.controller";
import { AiService } from "./ai.service";

@Module({
  imports: [
    AppConfigModule,
    ChartsModule,
    DevicesModule,
  ],
  controllers: [AiController],
  providers: [AiService],
})
export class AiModule {}
