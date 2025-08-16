import { Injectable } from '@nestjs/common';
import { appConfigSchema } from './interfaces/appConfig.interface';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  private readonly config: appConfigSchema;
  constructor(private readonly configService: ConfigService) {
    this.config = {
      database: {
        username: this.configService.get<string>("DB_USER", ""),
        password: this.configService.get<string>("DB_PASS", ""),
        host: this.configService.get<string>("DB_HOST", ""),
        port: this.configService.get<number>("DB_PORT", 5432),
        database_name: this.configService.get<string>("DB_NAME", ""),
      },
    };
  }

  public getConfig(): appConfigSchema {
    return this.config;
  }
}
