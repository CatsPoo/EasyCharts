import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ChartsDirectoriesService } from './chartsDirectories.service';
import { ChartsDirectoryEntity } from './entities/chartsDirectory.entity';
import { ChartInDirectoryEntity } from './entities/chartsInDirectory.entity';
import { DirectoryShareEntity } from './entities/directoryShare.entity';
import { ChartEntity } from '../charts/entities/chart.entity';
import { ChartShareEntity } from '../charts/entities/chartShare.entity';
import { ChartsService } from '../charts/charts.service';

const makeDir = (overrides: Partial<ChartsDirectoryEntity> = {}): ChartsDirectoryEntity =>
  ({
    id: 'dir-1',
    name: 'Root Dir',
    description: '',
    parentId: null,
    createdByUserId: 'user-owner',
    updatedByUserId: null,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides,
  } as ChartsDirectoryEntity);

describe('ChartsDirectoriesService', () => {
  let service: ChartsDirectoriesService;

  // Minimal query builder returned by dirRepo.createQueryBuilder
  const makeQb = (existsResult = false, getManyResult: any[] = []) => ({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getExists: jest.fn().mockResolvedValue(existsResult),
    getMany: jest.fn().mockResolvedValue(getManyResult),
    leftJoin: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
  });

  let qbInstance: ReturnType<typeof makeQb>;

  const mockDirRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    delete: jest.fn(),
    exist: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockCidRepo = {
    find: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
  };

  const mockShareDirRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
  };

  const mockChartRepo = {
    createQueryBuilder: jest.fn(),
  };

  const mockChartShareRepo = {
    upsert: jest.fn(),
    delete: jest.fn(),
  };

  const mockChartsService = {
    buildChartMetadataWithPrivileges: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    qbInstance = makeQb();
    mockDirRepo.createQueryBuilder.mockReturnValue(qbInstance);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChartsDirectoriesService,
        { provide: getRepositoryToken(ChartsDirectoryEntity), useValue: mockDirRepo },
        { provide: getRepositoryToken(ChartInDirectoryEntity), useValue: mockCidRepo },
        { provide: getRepositoryToken(DirectoryShareEntity), useValue: mockShareDirRepo },
        { provide: getRepositoryToken(ChartEntity), useValue: mockChartRepo },
        { provide: getRepositoryToken(ChartShareEntity), useValue: mockChartShareRepo },
        { provide: ChartsService, useValue: mockChartsService },
      ],
    }).compile();

    service = module.get<ChartsDirectoriesService>(ChartsDirectoriesService);
  });

  // ── createChartsDirectory ────────────────────────────────────────────────────

  describe('createChartsDirectory', () => {
    it('creates and saves a root directory', async () => {
      qbInstance.getExists.mockResolvedValue(false);
      const entity = makeDir();
      mockDirRepo.create.mockReturnValue(entity);
      mockDirRepo.save.mockResolvedValue(entity);

      const result = await service.createChartsDirectory(
        { name: 'Root Dir', parentId: null },
        'user-owner',
      );

      expect(mockDirRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ createdByUserId: 'user-owner' }),
      );
      expect(result.name).toBe('Root Dir');
    });

    it('throws BadRequestException when name already exists among siblings', async () => {
      qbInstance.getExists.mockResolvedValue(true);

      await expect(
        service.createChartsDirectory({ name: 'Root Dir', parentId: null }, 'user-owner'),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when parentId does not exist', async () => {
      qbInstance.getExists.mockResolvedValue(false);
      mockDirRepo.findOne.mockResolvedValue(null);

      await expect(
        service.createChartsDirectory({ name: 'Child', parentId: 'bad-parent' }, 'user-owner'),
      ).rejects.toThrow(BadRequestException);
    });

    it('creates child directory under existing parent', async () => {
      qbInstance.getExists.mockResolvedValue(false);
      mockDirRepo.findOne.mockResolvedValue(makeDir()); // parent exists
      const child = makeDir({ id: 'dir-2', name: 'Child', parentId: 'dir-1' });
      mockDirRepo.create.mockReturnValue(child);
      mockDirRepo.save.mockResolvedValue(child);

      const result = await service.createChartsDirectory(
        { name: 'Child', parentId: 'dir-1' },
        'user-owner',
      );

      expect(result.parentId).toBe('dir-1');
    });
  });

  // ── getChartsDirectoryById ───────────────────────────────────────────────────

  describe('getChartsDirectoryById', () => {
    it('returns directory when found', async () => {
      mockDirRepo.findOne.mockResolvedValue(makeDir());

      const result = await service.getChartsDirectoryById('dir-1');
      expect(result.id).toBe('dir-1');
    });

    it('throws NotFoundException when not found', async () => {
      mockDirRepo.findOne.mockResolvedValue(null);

      await expect(service.getChartsDirectoryById('missing')).rejects.toThrow(NotFoundException);
    });
  });

  // ── updateChartsDirectory ────────────────────────────────────────────────────

  describe('updateChartsDirectory', () => {
    it('allows owner to update directory name', async () => {
      const dir = makeDir({ createdByUserId: 'user-owner' });
      mockDirRepo.findOne.mockResolvedValue(dir);
      qbInstance.getExists.mockResolvedValue(false);
      mockDirRepo.save.mockResolvedValue({ ...dir, name: 'New Name' });

      const result = await service.updateChartsDirectory('dir-1', { name: 'New Name' }, 'user-owner');

      expect(result.name).toBe('New Name');
    });

    it('throws NotFoundException when directory does not exist', async () => {
      mockDirRepo.findOne.mockResolvedValue(null);

      await expect(
        service.updateChartsDirectory('missing', { name: 'X' }, 'user-owner'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when non-owner has no edit permission', async () => {
      mockDirRepo.findOne.mockResolvedValue(makeDir({ createdByUserId: 'other-user' }));
      mockShareDirRepo.findOne.mockResolvedValue(null); // no share

      await expect(
        service.updateChartsDirectory('dir-1', { name: 'X' }, 'user-current'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('allows shared user with canEdit to update', async () => {
      const dir = makeDir({ createdByUserId: 'other-user' });
      mockDirRepo.findOne.mockResolvedValue(dir);
      mockShareDirRepo.findOne.mockResolvedValue({ canEdit: true });
      qbInstance.getExists.mockResolvedValue(false);
      mockDirRepo.save.mockResolvedValue({ ...dir, description: 'Updated' });

      const result = await service.updateChartsDirectory(
        'dir-1',
        { description: 'Updated' },
        'user-current',
      );

      expect(result.description).toBe('Updated');
    });
  });

  // ── remove ───────────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('removes directory when owner calls it', async () => {
      // assertDirectoryPermission: findOne returns dir with matching createdByUserId
      mockDirRepo.findOne.mockResolvedValue(makeDir({ createdByUserId: 'user-owner' }));
      mockDirRepo.exist.mockResolvedValue(true);
      mockDirRepo.delete.mockResolvedValue({ affected: 1 });

      await service.remove('dir-1', 'user-owner');

      expect(mockDirRepo.delete).toHaveBeenCalledWith({ id: 'dir-1' });
    });

    it('throws NotFoundException when directory does not exist after permission check', async () => {
      mockDirRepo.findOne.mockResolvedValue(makeDir({ createdByUserId: 'user-owner' }));
      mockDirRepo.exist.mockResolvedValue(false);

      await expect(service.remove('dir-1', 'user-owner')).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when non-owner has no canDelete permission', async () => {
      mockDirRepo.findOne.mockResolvedValue(makeDir({ createdByUserId: 'other-user' }));
      mockShareDirRepo.findOne.mockResolvedValue({ canDelete: false });

      await expect(service.remove('dir-1', 'user-current')).rejects.toThrow(ForbiddenException);
    });
  });

  // ── addChart ─────────────────────────────────────────────────────────────────

  describe('addChart', () => {
    it('upserts chart into directory', async () => {
      mockDirRepo.findOne.mockResolvedValue(makeDir());
      mockCidRepo.upsert.mockResolvedValue(undefined);

      await service.addChart('dir-1', 'chart-1', 'user-owner');

      expect(mockCidRepo.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ directoryId: 'dir-1', chartId: 'chart-1' }),
        expect.objectContaining({ conflictPaths: ['directoryId', 'chartId'] }),
      );
    });

    it('throws NotFoundException when directory does not exist', async () => {
      mockDirRepo.findOne.mockResolvedValue(null);

      await expect(service.addChart('bad', 'chart-1', 'user-owner')).rejects.toThrow(NotFoundException);
    });
  });

  // ── removeChart ───────────────────────────────────────────────────────────────

  describe('removeChart', () => {
    it('removes chart from directory', async () => {
      mockCidRepo.delete.mockResolvedValue({ affected: 1 });

      await service.removeChart('dir-1', 'chart-1');

      expect(mockCidRepo.delete).toHaveBeenCalledWith({ directoryId: 'dir-1', chartId: 'chart-1' });
    });

    it('throws NotFoundException when chart is not in directory', async () => {
      mockCidRepo.delete.mockResolvedValue({ affected: 0 });

      await expect(service.removeChart('dir-1', 'chart-missing')).rejects.toThrow(NotFoundException);
    });
  });

  // ── shareDirectory ────────────────────────────────────────────────────────────

  describe('shareDirectory', () => {
    const permissions = { canEdit: true, canDelete: false, canShare: false };

    it('shares directory when sharedByUser is owner', async () => {
      // assertDirectoryPermission -> owner check
      mockDirRepo.findOne.mockResolvedValue(makeDir({ createdByUserId: 'user-owner' }));
      mockShareDirRepo.upsert.mockResolvedValue(undefined);

      await service.shareDirectory('dir-1', 'user-b', 'user-owner', permissions);

      expect(mockShareDirRepo.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ directoryId: 'dir-1', sharedWithUserId: 'user-b' }),
        expect.anything(),
      );
    });

    it('throws ForbiddenException when sharedByUser has no canShare permission', async () => {
      mockDirRepo.findOne.mockResolvedValue(makeDir({ createdByUserId: 'other-user' }));
      mockShareDirRepo.findOne.mockResolvedValue({ canShare: false });

      await expect(
        service.shareDirectory('dir-1', 'user-b', 'user-current', permissions),
      ).rejects.toThrow(ForbiddenException);
    });

    it('also shares chart content when includeContent is true', async () => {
      mockDirRepo.findOne.mockResolvedValue(makeDir({ createdByUserId: 'user-owner' }));
      mockShareDirRepo.upsert.mockResolvedValue(undefined);
      mockCidRepo.find.mockResolvedValue([{ chartId: 'chart-1' }]);
      mockChartShareRepo.upsert.mockResolvedValue(undefined);

      await service.shareDirectory('dir-1', 'user-b', 'user-owner', permissions, true);

      expect(mockChartShareRepo.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ chartId: 'chart-1', sharedWithUserId: 'user-b' }),
        expect.anything(),
      );
    });
  });

  // ── unshareDirectory ──────────────────────────────────────────────────────────

  describe('unshareDirectory', () => {
    it('removes the share record', async () => {
      mockShareDirRepo.delete.mockResolvedValue({ affected: 1 });

      await service.unshareDirectory('dir-1', 'user-b');

      expect(mockShareDirRepo.delete).toHaveBeenCalledWith({
        directoryId: 'dir-1',
        sharedWithUserId: 'user-b',
      });
    });
  });

  // ── listRoots ─────────────────────────────────────────────────────────────────

  describe('listRoots', () => {
    it('returns root directories for the user via query builder', async () => {
      qbInstance.getMany.mockResolvedValue([makeDir()]);
      const result = await service.listRoots('user-owner');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('dir-1');
    });

    it('returns empty array when user has no root directories', async () => {
      qbInstance.getMany.mockResolvedValue([]);
      const result = await service.listRoots('user-owner');
      expect(result).toEqual([]);
    });
  });

  // ── listChildren ──────────────────────────────────────────────────────────────

  describe('listChildren', () => {
    it('returns child directories for a given parentId and user', async () => {
      const child = makeDir({ id: 'dir-2', parentId: 'dir-1' });
      qbInstance.getMany.mockResolvedValue([child]);
      const result = await service.listChildren('dir-1', 'user-owner');
      expect(result).toHaveLength(1);
      expect(result[0].parentId).toBe('dir-1');
    });

    it('returns empty array when there are no children', async () => {
      qbInstance.getMany.mockResolvedValue([]);
      const result = await service.listChildren('dir-1', 'user-owner');
      expect(result).toEqual([]);
    });
  });

  // ── listCharts ────────────────────────────────────────────────────────────────

  describe('listCharts', () => {
    it('returns chart-in-directory records for an existing directory', async () => {
      mockDirRepo.findOne.mockResolvedValue(makeDir());
      mockCidRepo.find.mockResolvedValue([{ directoryId: 'dir-1', chartId: 'chart-1' }]);
      const result = await service.listCharts('dir-1');
      expect(result).toHaveLength(1);
      expect(result[0].chartId).toBe('chart-1');
    });

    it('throws NotFoundException when directory does not exist', async () => {
      mockDirRepo.findOne.mockResolvedValue(null);
      await expect(service.listCharts('bad')).rejects.toThrow(NotFoundException);
    });
  });

  // ── listChartsMetadata ────────────────────────────────────────────────────────

  describe('listChartsMetadata', () => {
    const chartQb = {
      innerJoin: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    };

    beforeEach(() => {
      mockChartRepo.createQueryBuilder.mockReturnValue(chartQb);
    });

    it('returns metadata for charts in the directory', async () => {
      mockDirRepo.findOne.mockResolvedValue(makeDir());
      chartQb.getMany.mockResolvedValue([{ id: 'chart-1', name: 'My Chart', createdByUserId: 'user-1' }]);
      mockChartsService.buildChartMetadataWithPrivileges.mockResolvedValue([{ id: 'chart-1' }]);

      const result = await service.listChartsMetadata('dir-1', 'user-owner');

      expect(mockChartsService.buildChartMetadataWithPrivileges).toHaveBeenCalled();
      expect(result).toEqual([{ id: 'chart-1' }]);
    });

    it('throws NotFoundException when directory does not exist', async () => {
      mockDirRepo.findOne.mockResolvedValue(null);
      await expect(service.listChartsMetadata('bad', 'user-owner')).rejects.toThrow(NotFoundException);
    });
  });

  // ── getDirectoryShares ────────────────────────────────────────────────────────

  describe('getDirectoryShares', () => {
    it('returns all share records for a directory', async () => {
      const shares = [{ directoryId: 'dir-1', sharedWithUserId: 'user-2' }];
      mockShareDirRepo.find.mockResolvedValue(shares);

      const result = await service.getDirectoryShares('dir-1');

      expect(mockShareDirRepo.find).toHaveBeenCalledWith({ where: { directoryId: 'dir-1' } });
      expect(result).toEqual(shares);
    });
  });

  // ── unshareDirectoryContent ───────────────────────────────────────────────────

  describe('unshareDirectoryContent', () => {
    it('deletes chart shares for all charts in directory', async () => {
      mockCidRepo.find.mockResolvedValue([{ chartId: 'chart-1' }, { chartId: 'chart-2' }]);
      mockChartShareRepo.delete.mockResolvedValue({ affected: 2 });

      await service.unshareDirectoryContent('dir-1', 'user-b');

      expect(mockChartShareRepo.delete).toHaveBeenCalledWith(
        expect.objectContaining({ sharedWithUserId: 'user-b' }),
      );
    });

    it('does not call delete when directory has no charts', async () => {
      mockCidRepo.find.mockResolvedValue([]);

      await service.unshareDirectoryContent('dir-1', 'user-b');

      expect(mockChartShareRepo.delete).not.toHaveBeenCalled();
    });
  });

  // ── search ────────────────────────────────────────────────────────────────────

  describe('search', () => {
    it('returns directories matching query string', async () => {
      mockDirRepo.find.mockResolvedValue([makeDir()]);
      const result = await service.search('Root');
      expect(mockDirRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ order: { name: 'ASC' } }),
      );
      expect(result).toHaveLength(1);
    });

    it('returns empty array when no directories match', async () => {
      mockDirRepo.find.mockResolvedValue([]);
      const result = await service.search('nomatch');
      expect(result).toEqual([]);
    });
  });

  // ── updateChartsDirectory — parentId changes ──────────────────────────────────

  describe('updateChartsDirectory — parentId changes', () => {
    it('throws BadRequestException when new parent does not exist', async () => {
      const dir = makeDir({ createdByUserId: 'user-owner', parentId: null });
      mockDirRepo.findOne
        .mockResolvedValueOnce(dir)         // getChartsDirectoryById
        .mockResolvedValueOnce(null);        // new parent lookup
      qbInstance.getExists.mockResolvedValue(false);

      await expect(
        service.updateChartsDirectory('dir-1', { parentId: 'bad-parent' }, 'user-owner'),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when moving directory would create a cycle', async () => {
      // dir-1 is currently a root; we try to move dir-1 under dir-2
      // but dir-2's parent chain leads back to dir-1
      const dir1 = makeDir({ id: 'dir-1', createdByUserId: 'user-owner', parentId: null });
      const dir2 = makeDir({ id: 'dir-2', parentId: 'dir-1' });

      mockDirRepo.findOne
        .mockResolvedValueOnce(dir1)         // initial load in updateChartsDirectory
        .mockResolvedValueOnce(dir2)         // new parent exists check
        .mockResolvedValueOnce(dir2)         // assertNoCycle: cursor='dir-2' → parent='dir-1'
        .mockResolvedValueOnce(dir1);        // not needed; cycle found after cursor=dir-1

      qbInstance.getExists.mockResolvedValue(false);

      await expect(
        service.updateChartsDirectory('dir-1', { parentId: 'dir-2' }, 'user-owner'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ── listChartIds ──────────────────────────────────────────────────────────────

  describe('listChartIds', () => {
    it('returns chart ids for directory', async () => {
      mockDirRepo.findOne.mockResolvedValue(makeDir());
      mockCidRepo.find.mockResolvedValue([{ chartId: 'chart-1' }, { chartId: 'chart-2' }]);

      const result = await service.listChartIds('dir-1');

      expect(result).toEqual(['chart-1', 'chart-2']);
    });

    it('throws NotFoundException when directory does not exist', async () => {
      mockDirRepo.findOne.mockResolvedValue(null);

      await expect(service.listChartIds('bad')).rejects.toThrow(NotFoundException);
    });
  });
});
