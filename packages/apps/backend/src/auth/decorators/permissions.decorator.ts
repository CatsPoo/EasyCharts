import { Permission } from '@easy-charts/easycharts-types';
import { SetMetadata } from '@nestjs/common';
export const PERMISSIONS_KEY = 'requiredPermissions';
export const RequirePermissions = (...perms: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, perms);
