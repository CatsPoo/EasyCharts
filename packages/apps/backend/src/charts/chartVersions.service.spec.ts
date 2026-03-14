import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ChartVersionEntity } from './entities/chartVersion.entity';
import { ChartVersionsService } from './chartVersions.service';

const makeRow = (overrides: Partial<ChartVersionEntity> = {}): ChartVersionEntity =>
  ({
    id: 'cver-1',
    chartId: 'chart-1',
    versionNumber: 1,
    snapshot: { id: 'chart-1', name: 'My Chart' } as any,
    label: null,
    savedByUserId: 'user-1',
    savedByUser: { id: 'user-1', username: 'admin' } as any,
    savedAt: new Date('2025-01-01'),
    ...overrides,
  } as ChartVersionEntity);

describe('ChartVersionsService', () => {
  let service: ChartVersionsService;

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
        ChartVersionsService,
        { provide: getRepositoryToken(ChartVersionEntity), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<ChartVersionsService>(ChartVersionsService);
  });

  // ── saveVersion ────────────────────────────────────────────────────────────

  describe('saveVersion', () => {
    it('inserts version 1 when chart has no prior versions', async () => {
      qbMock.getRawOne.mockResolvedValue({ max: null });
      mockRepo.insert.mockResolvedValue(undefined);

      await service.saveVersion('chart-1', { id: 'chart-1' } as any, 'user-1');

      expect(mockRepo.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          chartId: 'chart-1',
          versionNumber: 1,
          savedByUserId: 'user-1',
          label: null,
        }),
      );
    });

    it('increments version number beyond the current max', async () => {
      qbMock.getRawOne.mockResolvedValue({ max: 3 });
      mockRepo.insert.mockResolvedValue(undefined);

      await service.saveVersion('chart-1', {} as any, 'user-1');

      expect(mockRepo.insert).toHaveBeenCalledWith(
        expect.objectContaining({ versionNumber: 4 }),
      );
    });

    it('stores an optional label when provided', async () => {
      qbMock.getRawOne.mockResolvedValue({ max: null });
      mockRepo.insert.mockResolvedValue(undefined);

      await service.saveVersion('chart-1', {} as any, 'user-1', 'Release v1.0');

      expect(mockRepo.insert).toHaveBeenCalledWith(
        expect.objectContaining({ label: 'Release v1.0' }),
      );
    });
  });

  // ── listVersions ────────────────────────────────────────────────────────────

  describe('listVersions', () => {
    it('returns mapped metadata in DESC version order', async () => {
      mockRepo.find.mockResolvedValue([
        makeRow({ versionNumber: 3, label: 'latest' }),
        makeRow({ versionNumber: 1, label: null }),
      ]);

      const result = await service.listVersions('chart-1');

      expect(mockRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { chartId: 'chart-1' },
          order: { versionNumber: 'DESC' },
        }),
      );
      expect(result).toHaveLength(2);
      expect(result[0].versionNumber).toBe(3);
      expect(result[0].label).toBe('latest');
      expect(result[0].savedByUsername).toBe('admin');
    });

    it('returns empty array when chart has no versions', async () => {
      mockRepo.find.mockResolvedValue([]);
      expect(await service.listVersions('chart-new')).toEqual([]);
    });

    it('uses null savedByUsername when user was deleted', async () => {
      mockRepo.find.mockResolvedValue([makeRow({ savedByUser: null })]);
      const result = await service.listVersions('chart-1');
      expect(result[0].savedByUsername).toBeNull();
    });
  });

  // ── getVersion ──────────────────────────────────────────────────────────────

  describe('getVersion', () => {
    it('returns full version with snapshot when found', async () => {
      const snap = { id: 'chart-1', name: 'My Chart' };
      mockRepo.findOne.mockResolvedValue(makeRow({ snapshot: snap as any }));

      const result = await service.getVersion('chart-1', 'cver-1');

      expect(mockRepo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'cver-1', chartId: 'chart-1' },
        }),
      );
      expect(result.snapshot).toEqual(snap);
      expect(result.chartId).toBe('chart-1');
    });

    it('throws NotFoundException when version does not exist', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.getVersion('chart-1', 'bad-ver')).rejects.toThrow(NotFoundException);
    });

    it('includes label in the returned version', async () => {
      mockRepo.findOne.mockResolvedValue(makeRow({ label: 'Stable' }));
      const result = await service.getVersion('chart-1', 'cver-1');
      expect(result.label).toBe('Stable');
    });
  });
});
