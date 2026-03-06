import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './user.controller';
import { UsersService } from './user.service';

const makeUser = (overrides = {}) => ({
  id: 'user-1',
  username: 'admin',
  displayName: 'Admin User',
  isActive: true,
  permissions: [],
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
  createdByUserId: 'admin',
  updatedByUserId: null,
  ...overrides,
});

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: jest.Mocked<UsersService>;

  const mockUsersService = {
    getAllUsers: jest.fn(),
    getUserById: jest.fn(),
    searchUsers: jest.fn(),
    createUser: jest.fn(),
    removeUser: jest.fn(),
    updateUser: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockUsersService }],
    })
      // Bypass all guards — not the concern of controller unit tests
      .overrideGuard(require('./guards/jwtAuth.guard').JwdAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(require('./guards/permissions.guard').PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get(UsersService) as jest.Mocked<UsersService>;
  });

  // ── findAll ─────────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('delegates to usersService.getAllUsers and returns the result', async () => {
      const users = [makeUser(), makeUser({ id: 'user-2', username: 'bob' })];
      mockUsersService.getAllUsers.mockResolvedValue(users);

      const result = await controller.findAll();

      expect(usersService.getAllUsers).toHaveBeenCalledTimes(1);
      expect(result).toEqual(users);
    });
  });

  // ── findOne (profile) ────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('returns the profile of the authenticated user', async () => {
      const user = makeUser();
      mockUsersService.getUserById.mockResolvedValue(user);

      const result = await controller.findOne({ user: user as any });

      expect(usersService.getUserById).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(user);
    });
  });

  // ── search ───────────────────────────────────────────────────────────────────

  describe('search', () => {
    it('delegates to usersService.searchUsers with query and userId', async () => {
      const users = [makeUser()];
      mockUsersService.searchUsers.mockResolvedValue(users);

      const result = await controller.search('admin', { user: 'user-1' } as any);

      expect(usersService.searchUsers).toHaveBeenCalledWith('admin', 'user-1');
      expect(result).toEqual(users);
    });

    it('passes empty string when no query provided', async () => {
      mockUsersService.searchUsers.mockResolvedValue([]);
      await controller.search('', { user: 'user-1' } as any);
      expect(usersService.searchUsers).toHaveBeenCalledWith('', 'user-1');
    });
  });

  // ── findById ─────────────────────────────────────────────────────────────────

  describe('findById', () => {
    it('returns user by id', async () => {
      const user = makeUser();
      mockUsersService.getUserById.mockResolvedValue(user);

      const result = await controller.findById('user-1');

      expect(usersService.getUserById).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(user);
    });
  });

  // ── create ────────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('delegates to usersService.createUser with dto and requester id', async () => {
      const dto = { username: 'newuser', password: 'pass', displayName: 'New', isActive: true, permissions: [] } as any;
      const created = makeUser({ id: 'user-new', username: 'newuser' });
      mockUsersService.createUser.mockResolvedValue(created);

      const result = await controller.create(dto, { user: 'admin' } as any);

      expect(usersService.createUser).toHaveBeenCalledWith(dto, 'admin');
      expect(result).toEqual(created);
    });
  });

  // ── remove ────────────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('delegates to usersService.removeUser', async () => {
      mockUsersService.removeUser.mockResolvedValue(undefined);

      await controller.remove('user-1');

      expect(usersService.removeUser).toHaveBeenCalledWith('user-1');
    });
  });

  // ── updateChart (update user) ─────────────────────────────────────────────────

  describe('updateChart', () => {
    it('delegates to usersService.updateUser with id, dto, and requester id', async () => {
      const dto = { displayName: 'Updated' } as any;
      const updated = makeUser({ displayName: 'Updated' });
      mockUsersService.updateUser.mockResolvedValue(updated);

      const result = await controller.updateChart('user-1', dto, { user: 'admin' } as any);

      expect(usersService.updateUser).toHaveBeenCalledWith('user-1', dto, 'admin');
      expect(result.displayName).toBe('Updated');
    });
  });
});
