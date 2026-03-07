import { Test, TestingModule } from '@nestjs/testing';
import { BootstrapSeederService } from './bootstrapSeeder.service';
import { UsersService } from './user.service';
import { AppConfigService } from '../appConfig/appConfig.service';

const mockUsersService = {
  getAllUsers: jest.fn(),
  createUser: jest.fn(),
};

const mockAppConfigService = {
  getConfig: jest.fn(() => ({
    defaultAdminUser: { username: 'admin', password: 'admin123' },
  })),
};

describe('BootstrapSeederService', () => {
  let service: BootstrapSeederService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BootstrapSeederService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: AppConfigService, useValue: mockAppConfigService },
      ],
    }).compile();

    service = module.get<BootstrapSeederService>(BootstrapSeederService);
  });

  describe('onApplicationBootstrap', () => {
    it('does nothing when users already exist', async () => {
      mockUsersService.getAllUsers.mockResolvedValue([{ id: 'existing-user' }]);

      await service.onApplicationBootstrap();

      expect(mockUsersService.createUser).not.toHaveBeenCalled();
    });

    it('creates admin user when no users exist', async () => {
      mockUsersService.getAllUsers.mockResolvedValue([]);
      mockUsersService.createUser.mockResolvedValue({ id: 'admin-1', username: 'admin' });

      await service.onApplicationBootstrap();

      expect(mockUsersService.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          username: 'admin',
          password: 'admin123',
          displayName: 'admin',
          isActive: true,
        }),
        expect.any(String), // generated UUID
      );
    });

    it('creates admin user with all permissions', async () => {
      mockUsersService.getAllUsers.mockResolvedValue([]);
      mockUsersService.createUser.mockResolvedValue({ id: 'admin-1' });

      await service.onApplicationBootstrap();

      const userCreate = mockUsersService.createUser.mock.calls[0][0];
      expect(Array.isArray(userCreate.permissions)).toBe(true);
      expect(userCreate.permissions.length).toBeGreaterThan(0);
    });

    it('does nothing when users list is non-empty (even with null entries)', async () => {
      mockUsersService.getAllUsers.mockResolvedValue([null, { id: 'u-1' }]);

      await service.onApplicationBootstrap();

      expect(mockUsersService.createUser).not.toHaveBeenCalled();
    });
  });
});
