import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { AppConfigService } from '../appConfig/appConfig.service';
import { AuthService } from './auth.service';
import { UserEntity } from './entities/user.entity';
import { UsersService } from './user.service';

jest.mock('bcrypt');

const mockUser = {
  id: 'user-1',
  username: 'testuser',
  displayName: 'Test User',
  isActive: true,
  permissions: [],
};

const mockUserEntity: Partial<UserEntity> = {
  ...mockUser,
  password: 'hashed_password',
  refreshTokenHash: 'hashed_refresh',
};

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            getUserWithPasswordByUsername: jest.fn(),
            getUserEntityById: jest.fn(),
            convertUserEntity: jest.fn(),
            getUserById: jest.fn(),
            updateUserRefreshToken: jest.fn(),
          },
        },
        {
          provide: AppConfigService,
          useValue: {
            getConfig: jest.fn().mockReturnValue({
              refreshJwt: { secret: 'refresh-secret', expiresIn: '7d' },
            }),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
  });

  // ── validateUser ────────────────────────────────────────────────────────────

  describe('validateUser', () => {
    it('returns user id when credentials are valid', async () => {
      usersService.getUserWithPasswordByUsername.mockResolvedValue(
        mockUserEntity as UserEntity,
      );
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('testuser', 'password');
      expect(result).toBe('user-1');
    });

    it('throws UnauthorizedException when password does not match', async () => {
      usersService.getUserWithPasswordByUsername.mockResolvedValue(
        mockUserEntity as UserEntity,
      );
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.validateUser('testuser', 'wrong')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException when user is inactive', async () => {
      usersService.getUserWithPasswordByUsername.mockResolvedValue({
        ...mockUserEntity,
        isActive: false,
      } as UserEntity);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(service.validateUser('testuser', 'password')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  // ── valudateRefreshToken ────────────────────────────────────────────────────

  describe('valudateRefreshToken', () => {
    it('returns converted user when token matches', async () => {
      usersService.getUserEntityById.mockResolvedValue(mockUserEntity as UserEntity);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      usersService.convertUserEntity.mockReturnValue(mockUser as any);

      const result = await service.valudateRefreshToken('user-1', 'valid_refresh');
      expect(result).toEqual(mockUser);
    });

    it('throws UnauthorizedException when token does not match', async () => {
      usersService.getUserEntityById.mockResolvedValue(mockUserEntity as UserEntity);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.valudateRefreshToken('user-1', 'bad_token'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when user lookup fails', async () => {
      usersService.getUserEntityById.mockRejectedValue(new Error('DB error'));

      await expect(
        service.valudateRefreshToken('x', 'token'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('uses empty string as fallback when refreshTokenHash is undefined', async () => {
      usersService.getUserEntityById.mockResolvedValue({
        ...mockUserEntity,
        refreshTokenHash: undefined,
      } as UserEntity);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.valudateRefreshToken('user-1', 'token'),
      ).rejects.toThrow(UnauthorizedException);
      expect(bcrypt.compare).toHaveBeenCalledWith('token', '');
    });
  });

  // ── generateTokens ──────────────────────────────────────────────────────────

  describe('generateTokens', () => {
    it('returns access token and refresh token', async () => {
      jwtService.signAsync
        .mockResolvedValueOnce('access_token')
        .mockResolvedValueOnce('refresh_token');

      const result = await service.generateTokens('user-1');
      expect(result.token).toBe('access_token');
      expect(result.refreshToken).toBe('refresh_token');
      expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
    });

    it('signs access token with user id as sub', async () => {
      jwtService.signAsync.mockResolvedValue('token');
      await service.generateTokens('user-1');
      expect(jwtService.signAsync).toHaveBeenCalledWith({ sub: 'user-1' });
    });

    it('signs refresh token with refresh jwt config', async () => {
      jwtService.signAsync.mockResolvedValue('token');
      await service.generateTokens('user-1');
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        { sub: 'user-1' },
        { secret: 'refresh-secret', expiresIn: '7d' },
      );
    });
  });

  // ── login ───────────────────────────────────────────────────────────────────

  describe('login', () => {
    it('returns user, token, and refreshToken', async () => {
      jwtService.signAsync
        .mockResolvedValueOnce('at')
        .mockResolvedValueOnce('rt');
      usersService.updateUserRefreshToken.mockResolvedValue(1);
      usersService.getUserById.mockResolvedValue(mockUser as any);

      const result = await service.login('user-1');
      expect(result.token).toBe('at');
      expect(result.refreshToken).toBe('rt');
      expect(result.user).toEqual(mockUser);
    });

    it('stores hashed refresh token in database', async () => {
      jwtService.signAsync
        .mockResolvedValueOnce('at')
        .mockResolvedValueOnce('rt');
      usersService.updateUserRefreshToken.mockResolvedValue(1);
      usersService.getUserById.mockResolvedValue(mockUser as any);

      await service.login('user-1');
      expect(usersService.updateUserRefreshToken).toHaveBeenCalledWith('user-1', 'rt');
    });
  });

  // ── refreshToken ────────────────────────────────────────────────────────────

  describe('refreshToken', () => {
    it('returns user and new access token', async () => {
      jwtService.signAsync.mockResolvedValue('new_access');
      usersService.getUserById.mockResolvedValue(mockUser as any);

      const result = await service.refreshToken('user-1');
      expect(result.token).toBe('new_access');
      expect(result.user).toEqual(mockUser);
    });
  });

  // ── logout ──────────────────────────────────────────────────────────────────

  describe('logout', () => {
    it('clears refresh token for user', async () => {
      usersService.updateUserRefreshToken.mockResolvedValue(1);
      await service.logout('user-1');
      expect(usersService.updateUserRefreshToken).toHaveBeenCalledWith('user-1', null);
    });
  });
});
