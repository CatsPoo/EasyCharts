// src/redis/redis.module.ts
import { Global, Module } from '@nestjs/common';
import Redis from 'ioredis';
import { AppConfigService } from '../appConfig/appConfig.service';

export const REDIS = Symbol('REDIS');

@Global()
@Module({
  providers: [
    {
      provide: REDIS,
      inject: [AppConfigService],
      useFactory: (cfg: AppConfigService) => new Redis(cfg.getConfig().redis.host),
    },
  ],
  exports: [REDIS],
})
export class RedisModule {}
