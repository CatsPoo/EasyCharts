import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Not, IsNull, Repository } from 'typeorm';
import { AppConfigService } from '../appConfig/appConfig.service';
import { ChartEntity } from './entities/chart.entity';

@Injectable()
export class ChartLockSchedulerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ChartLockSchedulerService.name);
  private intervalRef: NodeJS.Timeout;

  constructor(
    @InjectRepository(ChartEntity)
    private readonly chartRepo: Repository<ChartEntity>,
    private readonly appConfigService: AppConfigService,
  ) {}

  onModuleInit() {
    const { checkIntervalSeconds } = this.appConfigService.getConfig().chartLock;
    this.intervalRef = setInterval(
      () => this.releaseExpiredLocks(),
      checkIntervalSeconds * 1000,
    );
    this.logger.log(
      `Lock expiry scheduler started — check every ${checkIntervalSeconds}s, expiry after ${this.appConfigService.getConfig().chartLock.expiryMinutes}m of inactivity`,
    );
  }

  onModuleDestroy() {
    clearInterval(this.intervalRef);
  }

  private async releaseExpiredLocks(): Promise<void> {
    const { expiryMinutes } = this.appConfigService.getConfig().chartLock;
    const expiryTime = new Date(Date.now() - expiryMinutes * 60 * 1000);

    const result = await this.chartRepo.update(
      { lockedById: Not(IsNull()), lockedAt: LessThan(expiryTime) },
      { lockedById: null, lockedAt: null },
    );

    if (result.affected && result.affected > 0) {
      this.logger.log(`Auto-released ${result.affected} expired chart lock(s)`);
    }
  }
}
