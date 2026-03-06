import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AssetVersionEntity } from './entities/assetVersion.entity';
import { AssetVersionsService } from './assetVersions.service';

const makeRow = (overrides: Partial<AssetVersionEntity> = {}): AssetVersionEntity =>
  ({
    id: 'ver-1',
    assetId: 'asset-1',
    assetKind: 'devices',
    versionNumber: 1,
    snapshot: { name: 'My Device' },
    savedByUserId: 'user-1',
    savedByUser: { id: 'user-1', username: 'admin' } as any,
    savedAt: new Date('2025-01-01'),
    ...overrides,
  } as AssetVersionEntity);

describe('AssetVersionsService', () => {
  let service: AssetVersionsService;
  let repo: jest.Mocked<any>;

  const qbMock = {
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getRawOne: jest.fn(),
  };

  const mockRepo = {
    createQueryBuilder: jest.fn(() => qbMock),
    insert: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssetVersionsService,
        { provide: getRepositoryToken(AssetVersionEntity), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<AssetVersionsService>(AssetVersionsService);
    repo = module.get(getRepositoryToken(AssetVersionEntity));
  });

  // ── saveVersion ────────────────────────────────────────────────────────────

  describe('saveVersion', () => {
    it('inserts version 1 when no prior versions exist', async () => {
      qbMock.getRawOne.mockResolvedValue({ max: null });
      mockRepo.insert.mockResolvedValue(undefined);

      await service.saveVersion('devices', 'asset-1', { name: 'Device' }, 'user-1');

      expect(mockRepo.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          assetId: 'asset-1',
          assetKind: 'devices',
          versionNumber: 1,
          savedByUserId: 'user-1',
        }),
      );
    });

    it('increments version number beyond the current max', async () => {
      qbMock.getRawOne.mockResolvedValue({ max: 5 });
      mockRepo.insert.mockResolvedValue(undefined);

      await service.saveVersion('devices', 'asset-1', {}, 'user-1');

      expect(mockRepo.insert).toHaveBeenCalledWith(
        expect.objectContaining({ versionNumber: 6 }),
      );
    });

    it('stores the provided snapshot object', async () => {
      qbMock.getRawOne.mockResolvedValue({ max: null });
      mockRepo.insert.mockResolvedValue(undefined);

      const snap = { name: 'Device', ipAddress: '10.0.0.1' };
      await service.saveVersion('devices', 'asset-1', snap, 'user-1');

      expect(mockRepo.insert).toHaveBeenCalledWith(
        expect.objectContaining({ snapshot: snap }),
      );
    });
  });

  // ── listVersions ────────────────────────────────────────────────────────────

  describe('listVersions', () => {
    it('returns mapped version metadata in DESC order', async () => {
      mockRepo.find.mockResolvedValue([
        makeRow({ versionNumber: 2 }),
        makeRow({ versionNumber: 1 }),
      ]);

      const result = await service.listVersions('devices', 'asset-1');

      expect(mockRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { assetId: 'asset-1', assetKind: 'devices' },
          order: { versionNumber: 'DESC' },
        }),
      );
      expect(result).toHaveLength(2);
      expect(result[0].versionNumber).toBe(2);
      expect(result[0].savedByUsername).toBe('admin');
    });

    it('returns empty array when no versions exist', async () => {
      mockRepo.find.mockResolvedValue([]);
      const result = await service.listVersions('devices', 'unknown');
      expect(result).toEqual([]);
    });

    it('handles null savedByUser gracefully', async () => {
      mockRepo.find.mockResolvedValue([makeRow({ savedByUser: null })]);
      const result = await service.listVersions('devices', 'asset-1');
      expect(result[0].savedByUsername).toBeNull();
    });
  });

  // ── getVersion ──────────────────────────────────────────────────────────────

  describe('getVersion', () => {
    it('returns full version with snapshot when found', async () => {
      const row = makeRow({ snapshot: { name: 'Device' } });
      mockRepo.findOne.mockResolvedValue(row);

      const result = await service.getVersion('devices', 'asset-1', 'ver-1');

      expect(mockRepo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'ver-1', assetId: 'asset-1', assetKind: 'devices' },
        }),
      );
      expect(result.snapshot).toEqual({ name: 'Device' });
      expect(result.versionNumber).toBe(1);
    });

    it('throws NotFoundException when version does not exist', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.getVersion('devices', 'asset-1', 'bad-ver')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('includes null savedByUsername when user was deleted', async () => {
      mockRepo.findOne.mockResolvedValue(makeRow({ savedByUser: null }));
      const result = await service.getVersion('devices', 'asset-1', 'ver-1');
      expect(result.savedByUsername).toBeNull();
    });
  });
});
