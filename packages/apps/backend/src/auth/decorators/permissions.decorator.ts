import { SetMetadata } from '@nestjs/common';
export const PERMISSIONS_KEY = 'requiredPermissions';
export const RequirePermissions = (...perms: string[]) =>
  SetMetadata(PERMISSIONS_KEY, perms);
