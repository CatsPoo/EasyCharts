import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChartEntity } from '../entities/chart.entity';
import { ChartShareEntity } from '../entities/chartShare.entity';
import { CHART_PRIVILEGE_KEY, ChartSharePrivilege } from '../decorators/requireChartPrivilege.decorator';

@Injectable()
export class ChartShareGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectRepository(ChartEntity)
    private readonly chartRepo: Repository<ChartEntity>,
    @InjectRepository(ChartShareEntity)
    private readonly chartShareRepo: Repository<ChartShareEntity>,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const privilege = this.reflector.getAllAndOverride<ChartSharePrivilege | undefined>(
      CHART_PRIVILEGE_KEY,
      [ctx.getHandler(), ctx.getClass()],
    );

    // No decorator on this route — skip chart-level check
    if (!privilege) return true;

    const req = ctx.switchToHttp().getRequest();
    const userId: string | undefined = req.user;
    if (!userId) throw new ForbiddenException('Not authenticated');

    // Supports both :id (ChartsController) and :chartId (ChartVersionsController)
    const chartId: string | undefined = req.params.id ?? req.params.chartId;
    if (!chartId) return true;

    const chart = await this.chartRepo.findOne({
      where: { id: chartId },
      select: { id: true, createdByUserId: true },
    });
    if (!chart) throw new NotFoundException(`Chart ${chartId} not found`);

    // Owner always has full access
    if (chart.createdByUserId === userId) return true;

    const share = await this.chartShareRepo.findOne({
      where: { chartId, sharedWithUserId: userId },
    });

    if (privilege === 'read') {
      if (share) return true;
    } else {
      if (share?.[privilege]) return true;
    }

    throw new ForbiddenException(`No ${privilege} permission on chart ${chartId}`);
  }
}
