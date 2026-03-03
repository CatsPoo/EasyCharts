import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { UsersService } from '../user.service';
import { PermissionsGuard } from './permissions.guard';

const makeContext = (userId: string | undefined): ExecutionContext =>
  ({
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({ user: userId }),
    }),
  } as unknown as ExecutionContext);

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let reflector: jest.Mocked<Reflector>;
  let usersService: jest.Mocked<UsersService>;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionsGuard,
        {
          provide: Reflector,
          useValue: { getAllAndOverride: jest.fn() },
        },
        {
          provide: UsersService,
          useValue: { getUserById: jest.fn() },
        },
      ],
    }).compile();

    guard = module.get<PermissionsGuard>(PermissionsGuard);
    reflector = module.get(Reflector);
    usersService = module.get(UsersService);
  });

  it('returns true when no permissions are required on the handler', async () => {
    reflector.getAllAndOverride.mockReturnValue([]);
    const result = await guard.canActivate(makeContext('user-1'));
    expect(result).toBe(true);
    expect(usersService.getUserById).not.toHaveBeenCalled();
  });

  it('returns true when required permissions list is null', async () => {
    reflector.getAllAndOverride.mockReturnValue(null);
    const result = await guard.canActivate(makeContext('user-1'));
    expect(result).toBe(true);
  });

  it('throws ForbiddenException when no user in request', async () => {
    reflector.getAllAndOverride.mockReturnValue(['MANAGE_USERS']);
    await expect(guard.canActivate(makeContext(undefined))).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('returns true when user has the required permission', async () => {
    reflector.getAllAndOverride.mockReturnValue(['MANAGE_USERS']);
    usersService.getUserById.mockResolvedValue({
      id: 'user-1',
      isActive: true,
      permissions: ['MANAGE_USERS'],
    } as any);

    const result = await guard.canActivate(makeContext('user-1'));
    expect(result).toBe(true);
  });

  it('throws ForbiddenException when user lacks required permission', async () => {
    reflector.getAllAndOverride.mockReturnValue(['MANAGE_USERS']);
    usersService.getUserById.mockResolvedValue({
      id: 'user-1',
      isActive: true,
      permissions: [],
    } as any);

    await expect(guard.canActivate(makeContext('user-1'))).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('throws ForbiddenException when user is inactive', async () => {
    reflector.getAllAndOverride.mockReturnValue(['MANAGE_USERS']);
    usersService.getUserById.mockResolvedValue({
      id: 'user-1',
      isActive: false,
      permissions: ['MANAGE_USERS'],
    } as any);

    await expect(guard.canActivate(makeContext('user-1'))).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('returns true when user has all required permissions (multiple)', async () => {
    reflector.getAllAndOverride.mockReturnValue(['MANAGE_USERS', 'VIEW_CHARTS']);
    usersService.getUserById.mockResolvedValue({
      id: 'user-1',
      isActive: true,
      permissions: ['MANAGE_USERS', 'VIEW_CHARTS', 'EDIT_CHARTS'],
    } as any);

    const result = await guard.canActivate(makeContext('user-1'));
    expect(result).toBe(true);
  });

  it('throws ForbiddenException when user has only some of the required permissions', async () => {
    reflector.getAllAndOverride.mockReturnValue(['MANAGE_USERS', 'VIEW_CHARTS']);
    usersService.getUserById.mockResolvedValue({
      id: 'user-1',
      isActive: true,
      permissions: ['MANAGE_USERS'],
    } as any);

    await expect(guard.canActivate(makeContext('user-1'))).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('uses the PERMISSIONS_KEY constant for reflector lookup', async () => {
    reflector.getAllAndOverride.mockReturnValue([]);
    await guard.canActivate(makeContext('user-1'));
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(
      PERMISSIONS_KEY,
      expect.any(Array),
    );
  });
});
