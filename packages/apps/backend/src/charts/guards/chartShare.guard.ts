import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { GroupMembershipEntity } from '../../groups/entities/groupMembership.entity';
import { ChartEntity } from '../entities/chart.entity';
import { ChartShareEntity } from '../entities/chartShare.entity';
import { GroupChartShareEntity } from '../entities/groupChartShare.entity';
import { CHART_PRIVILEGE_KEY, ChartSharePrivilege } from '../decorators/requireChartPrivilege.decorator';

@Injectable()
export class ChartShareGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectRepository(ChartEntity)
    private readonly chartRepo: Repository<ChartEntity>,
    @InjectRepository(ChartShareEntity)
    private readonly chartShareRepo: Repository<ChartShareEntity>,
    @InjectRepository(GroupChartShareEntity)
    private readonly groupChartShareRepo: Repository<GroupChartShareEntity>,
    @InjectRepository(GroupMembershipEntity)
    private readonly membershipRepo: Repository<GroupMembershipEntity>,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const privilege = this.reflector.getAllAndOverride<ChartSharePrivilege | undefined>(
      CHART_PRIVILEGE_KEY,
      [ctx.getHandler(), ctx.getClass()],
    );

    if (!privilege) return true;

    const req = ctx.switchToHttp().getRequest();
    const userId: string | undefined = req.user;
    if (!userId) throw new ForbiddenException('Not authenticated');

    const chartId: string | undefined = req.params.id ?? req.params.chartId;
    if (!chartId) return true;

    const chart = await this.chartRepo.findOne({
      where: { id: chartId },
      select: { id: true, createdByUserId: true },
    });
    if (!chart) throw new NotFoundException(`Chart ${chartId} not found`);

    if (chart.createdByUserId === userId) return true;

    // Check user-specific share first (overrides group)
    const userShare = await this.chartShareRepo.findOne({
      where: { chartId, sharedWithUserId: userId },
    });

    if (userShare) {
      if (privilege === 'read') return true;
      if (userShare[privilege]) return true;
      throw new ForbiddenException(`No ${privilege} permission on chart ${chartId}`);
    }

    // Fall back to group shares
    const groupIds = await this.membershipRepo.find({ where: { userId }, select: ['groupId'] });
    if (groupIds.length > 0) {
      const groupShares = await this.groupChartShareRepo.find({
        where: { chartId, groupId: In(groupIds.map(g => g.groupId)) },
      });
      if (groupShares.length > 0) {
        if (privilege === 'read') return true;
        if (groupShares.some(gs => gs[privilege])) return true;
      }
    }

    throw new ForbiddenException(`No ${privilege} permission on chart ${chartId}`);
  }
}
