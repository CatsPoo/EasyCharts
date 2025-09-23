import { Permission, User } from '@easy-charts/easycharts-types';
import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { UsersService } from '../user.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
     private readonly userService: UsersService,
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

    const user : User = await this.userService.getUserById(authUserId)
    if (!user || !user.isActive) throw new ForbiddenException('User not found or inactive');

    const set = new Set(user.permissions ?? []);
    const ok = required.every((p) => set.has(p));
    if (!ok) throw new ForbiddenException('Insufficient permissions');

    return true;
  }
}
