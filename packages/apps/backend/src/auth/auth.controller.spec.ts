import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

const mockUser = {
  id: 'user-1',
  username: 'testuser',
  displayName: 'Test User',
  isActive: true,
  permissions: [],
};

const mockAuthResponse = {
  token: 'access_token',
  refreshToken: 'refresh_token',
  user: mockUser,
};

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest.fn(),
            refreshToken: jest.fn(),
            logout: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  // ── login ───────────────────────────────────────────────────────────────────

  describe('login', () => {
    it('calls authService.login with user id from request and returns response', async () => {
      authService.login.mockResolvedValue(mockAuthResponse);

      const result = await controller.login({ user: 'user-1' });
      expect(authService.login).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(mockAuthResponse);
    });
  });

  // ── refresh ─────────────────────────────────────────────────────────────────

  describe('refresh', () => {
    it('calls authService.refreshToken and returns response', async () => {
      const refreshResponse = { token: 'new_token', user: mockUser };
      authService.refreshToken.mockResolvedValue(refreshResponse);

      const result = await controller.refresh({ user: 'user-1' });
      expect(authService.refreshToken).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(refreshResponse);
    });
  });

  // ── logout ──────────────────────────────────────────────────────────────────

  describe('logout', () => {
    it('calls authService.logout with user id from request', async () => {
      authService.logout.mockResolvedValue(undefined);

      await controller.logout({ user: 'user-1' });
      expect(authService.logout).toHaveBeenCalledWith('user-1');
    });
  });
});
