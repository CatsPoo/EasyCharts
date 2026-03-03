import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { UserEntity } from './entities/user.entity';
import { UsersService } from './user.service';

jest.mock('bcrypt');

const makeUserEntity = (overrides: Partial<UserEntity> = {}): UserEntity =>
  ({
    id: 'user-1',
    username: 'testuser',
    displayName: 'Test User',
    password: 'hashed_password',
    isActive: true,
    permissions: [],
    refreshTokenHash: undefined,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    createdByUserId: 'admin',
    updatedByUserId: null,
    ...overrides,
  } as UserEntity);

describe('UsersService', () => {
  let service: UsersService;
  let repo: jest.Mocked<any>;

  const mockRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(UserEntity), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repo = module.get(getRepositoryToken(UserEntity));
  });

  // ── convertUserEntity ───────────────────────────────────────────────────────

  describe('convertUserEntity', () => {
    it('strips password and refreshTokenHash', () => {
      const entity = makeUserEntity({ password: 'secret', refreshTokenHash: 'hash' });
      const result = service.convertUserEntity(entity);
      expect((result as any).password).toBeUndefined();
      expect((result as any).refreshTokenHash).toBeUndefined();
    });

    it('keeps all safe fields', () => {
      const entity = makeUserEntity();
      const result = service.convertUserEntity(entity);
      expect(result.id).toBe('user-1');
      expect(result.username).toBe('testuser');
      expect(result.displayName).toBe('Test User');
      expect(result.isActive).toBe(true);
    });
  });

  // ── getAllUsers ─────────────────────────────────────────────────────────────

  describe('getAllUsers', () => {
    it('returns all users without sensitive fields', async () => {
      repo.find.mockResolvedValue([
        makeUserEntity({ id: 'user-1' }),
        makeUserEntity({ id: 'user-2', username: 'other' }),
      ]);
      const result = await service.getAllUsers();
      expect(result).toHaveLength(2);
      result.forEach((u) => {
        expect((u as any).password).toBeUndefined();
        expect((u as any).refreshTokenHash).toBeUndefined();
      });
    });

    it('returns empty array when no users exist', async () => {
      repo.find.mockResolvedValue([]);
      expect(await service.getAllUsers()).toEqual([]);
    });
  });

  // ── getUserById ─────────────────────────────────────────────────────────────

  describe('getUserById', () => {
    it('returns safe user object when found', async () => {
      repo.findOne.mockResolvedValue(makeUserEntity());
      const result = await service.getUserById('user-1');
      expect(result.id).toBe('user-1');
      expect((result as any).password).toBeUndefined();
    });

    it('throws NotFoundException when user does not exist', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.getUserById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  // ── getUserEntityById ───────────────────────────────────────────────────────

  describe('getUserEntityById', () => {
    it('returns full entity including sensitive fields', async () => {
      const entity = makeUserEntity({ refreshTokenHash: 'stored_hash' });
      repo.findOne.mockResolvedValue(entity);
      const result = await service.getUserEntityById('user-1');
      expect(result.refreshTokenHash).toBe('stored_hash');
      expect(result.password).toBe('hashed_password');
    });

    it('throws NotFoundException when user does not exist', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.getUserEntityById('x')).rejects.toThrow(NotFoundException);
    });
  });

  // ── getUserWithPasswordByUsername ───────────────────────────────────────────

  describe('getUserWithPasswordByUsername', () => {
    it('returns entity with password when found', async () => {
      repo.findOne.mockResolvedValue(makeUserEntity());
      const result = await service.getUserWithPasswordByUsername('testuser');
      expect(result.password).toBe('hashed_password');
    });

    it('throws NotFoundException when username not found', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(
        service.getUserWithPasswordByUsername('unknown'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── createUser ──────────────────────────────────────────────────────────────

  describe('createUser', () => {
    const dto = {
      username: 'newuser',
      password: 'plaintext',
      displayName: 'New User',
      isActive: true,
      permissions: [] as any[],
    };

    it('hashes password and creates user', async () => {
      repo.find.mockResolvedValue([]);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_pass');
      repo.save.mockResolvedValue(makeUserEntity({ username: 'newuser', password: 'hashed_pass' }));

      const result = await service.createUser(dto, 'admin');
      expect(bcrypt.hash).toHaveBeenCalledWith('plaintext', 12);
      expect((result as any).password).toBeUndefined();
    });

    it('throws BadRequestException when username already exists', async () => {
      repo.find.mockResolvedValue([makeUserEntity()]);
      await expect(
        service.createUser({ ...dto, username: 'testuser' }, 'admin'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ── updateUser ──────────────────────────────────────────────────────────────

  describe('updateUser', () => {
    it('updates displayName', async () => {
      const entity = makeUserEntity();
      repo.findOne.mockResolvedValue(entity);
      repo.save.mockResolvedValue({ ...entity, displayName: 'Updated' });

      const result = await service.updateUser('user-1', { displayName: 'Updated' }, 'admin');
      expect(result.displayName).toBe('Updated');
    });

    it('hashes new password when provided', async () => {
      repo.findOne.mockResolvedValue(makeUserEntity());
      (bcrypt.hash as jest.Mock).mockResolvedValue('new_hash');
      repo.save.mockResolvedValue(makeUserEntity({ password: 'new_hash' }));

      await service.updateUser('user-1', { password: 'newpass' }, 'admin');
      expect(bcrypt.hash).toHaveBeenCalledWith('newpass', 12);
    });

    it('throws NotFoundException when user does not exist', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.updateUser('x', {}, 'admin')).rejects.toThrow(NotFoundException);
    });
  });

  // ── removeUser ──────────────────────────────────────────────────────────────

  describe('removeUser', () => {
    it('removes user when found', async () => {
      const entity = makeUserEntity();
      repo.findOne.mockResolvedValue(entity);
      repo.remove.mockResolvedValue(entity);

      await service.removeUser('user-1');
      expect(repo.remove).toHaveBeenCalledWith(entity);
    });

    it('throws NotFoundException when user does not exist', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.removeUser('x')).rejects.toThrow(NotFoundException);
    });
  });

  // ── updateUserRefreshToken ──────────────────────────────────────────────────

  describe('updateUserRefreshToken', () => {
    it('hashes token and stores it', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('refresh_hash');
      repo.update.mockResolvedValue({ affected: 1 });

      const result = await service.updateUserRefreshToken('user-1', 'my_token');
      expect(bcrypt.hash).toHaveBeenCalledWith('my_token', 12);
      expect(repo.update).toHaveBeenCalledWith('user-1', { refreshTokenHash: 'refresh_hash' });
      expect(result).toBe(1);
    });

    it('stores null when logging out (null token)', async () => {
      repo.update.mockResolvedValue({ affected: 1 });

      await service.updateUserRefreshToken('user-1', null);
      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(repo.update).toHaveBeenCalledWith('user-1', { refreshTokenHash: null });
    });

    it('throws NotFoundException when affected rows is 0', async () => {
      repo.update.mockResolvedValue({ affected: 0 });
      await expect(
        service.updateUserRefreshToken('x', 'token'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
