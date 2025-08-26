import { Module } from "@nestjs/common";
import { ConfigModule } from '@nestjs/config';
import { AppConfigService } from "./appConfig.service";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: "./packages/apps/backend/.env",
    }),
  ],
  controllers: [],
  providers: [AppConfigService],
  exports: [AppConfigService],
})
export class AppConfigModule {}
