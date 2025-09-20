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
      jwt: {
        secret: this.configService.get<string>("JWT_SECRET", ""),
        expiresIn: this.configService.get<string>("JWT_EXPIRE_IN", ""),
      },
      refreshJwt: {
        secret: this.configService.get<string>("REFRESH_JWT_SECRET", ""),
        expiresIn: this.configService.get<string>("REFRESH_JWT_EXPIRE_IN", ""),
      },
      redis: {
        username: this.configService.get<string>("REDIS_USERNAME", ""),
        password: this.configService.get<string>("REDIS_PASSWORD", ""),
        host: this.configService.get<string>("REDIS_HOST", ""),
        port: this.configService.get<number>("REDIS_PORT", 1234),
      },
    };
  }

  public getConfig(): appConfigSchema {
    return this.config;
  }
}
