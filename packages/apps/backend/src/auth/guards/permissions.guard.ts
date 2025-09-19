import { Permission } from '@easy-charts/easycharts-types';
import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { UserEntity } from '../entities/user.entity';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectRepository(UserEntity) private readonly usersRepo: Repository<UserEntity>,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<Permission[]>(PERMISSIONS_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const req = ctx.switchToHttp().getRequest();
    const authUserId :  string | undefined= req.user // set by JwtStrategy
    if (!authUserId) throw new ForbiddenException('Not authenticated');

    const user = await this.usersRepo.findOne({
      where: { id:authUserId, isActive: true },
      select: { id: true, permissions: true },
    });
    if (!user) throw new ForbiddenException('User not found or inactive');

    const set = new Set(user.permissions ?? []);
    const ok = required.every((p) => set.has(p));
    if (!ok) throw new ForbiddenException('Insufficient permissions');

    return true;
  }
}
