import { HttpException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CloudEntity } from './entities/cloud.entity';
import { CloudsService } from './clouds.service';
import { AssetVersionsService } from './assetVersions.service';

const makeCloud = (overrides: Partial<CloudEntity> = {}): CloudEntity =>
  ({
    id: 'cloud-1',
    name: 'AWS',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    createdByUserId: 'admin',
    updatedByUserId: null,
    ...overrides,
  } as CloudEntity);

describe('CloudsService', () => {
  let service: CloudsService;
  let repo: jest.Mocked<any>;
  let assetVersionsService: jest.Mocked<any>;
  let dataSource: jest.Mocked<any>;

  const qbMock = {
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
  };

  const cocQbMock = {
    innerJoin: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getRawMany: jest.fn(),
  };

  const cocRepoMock = {
    createQueryBuilder: jest.fn(() => cocQbMock),
  };

  const mockRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(() => qbMock),
  };

  const mockAssetVersionsService = { saveVersion: jest.fn() };
  const mockDataSource = { getRepository: jest.fn(() => cocRepoMock) };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CloudsService,
        { provide: getRepositoryToken(CloudEntity), useValue: mockRepo },
        { provide: AssetVersionsService, useValue: mockAssetVersionsService },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<CloudsService>(CloudsService);
    repo = module.get(getRepositoryToken(CloudEntity));
    assetVersionsService = module.get(AssetVersionsService);
    dataSource = module.get(DataSource);
  });

  // ── createCloud ────────────────────────────────────────────────────────────

  describe('createCloud', () => {
    it('creates and saves cloud with version snapshot', async () => {
      const dto = { name: 'AWS' };
      const entity = makeCloud();
      mockRepo.create.mockReturnValue(entity);
      mockRepo.save.mockResolvedValue(entity);
      mockAssetVersionsService.saveVersion.mockResolvedValue(undefined);

      const result = await service.createCloud(dto, 'admin');

      expect(mockRepo.create).toHaveBeenCalledWith({ ...dto, createdByUserId: 'admin' });
      expect(mockRepo.save).toHaveBeenCalledWith(entity);
      expect(assetVersionsService.saveVersion).toHaveBeenCalledWith(
        'clouds', entity.id, entity, 'admin',
      );
      expect(result.name).toBe('AWS');
    });
  });

  // ── listClouds ─────────────────────────────────────────────────────────────

  describe('listClouds', () => {
    it('returns paginated clouds with defaults', async () => {
      qbMock.getManyAndCount.mockResolvedValue([[makeCloud()], 1]);

      const result = await service.listClouds({});

      expect(result).toEqual({ rows: [makeCloud()], total: 1 });
      expect(qbMock.orderBy).toHaveBeenCalledWith('c.name', 'ASC');
      expect(qbMock.skip).toHaveBeenCalledWith(0);
      expect(qbMock.take).toHaveBeenCalledWith(25);
    });

    it('applies search filter', async () => {
      qbMock.getManyAndCount.mockResolvedValue([[], 0]);
      await service.listClouds({ search: 'azure' });
      expect(qbMock.where).toHaveBeenCalledWith('LOWER(c.name) LIKE :s', { s: '%azure%' });
    });

    it('falls back to name sort for disallowed sortBy', async () => {
      qbMock.getManyAndCount.mockResolvedValue([[], 0]);
      await service.listClouds({ sortBy: 'invalid' });
      expect(qbMock.orderBy).toHaveBeenCalledWith('c.name', 'ASC');
    });

    it('respects allowed sortBy column', async () => {
      qbMock.getManyAndCount.mockResolvedValue([[], 0]);
      await service.listClouds({ sortBy: 'id', sortDir: 'desc' });
      expect(qbMock.orderBy).toHaveBeenCalledWith('c.id', 'DESC');
    });
  });

  // ── getCloudById ───────────────────────────────────────────────────────────

  describe('getCloudById', () => {
    it('returns cloud when found', async () => {
      mockRepo.findOne.mockResolvedValue(makeCloud());
      const result = await service.getCloudById('cloud-1');
      expect(result.id).toBe('cloud-1');
    });

    it('throws NotFoundException when not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.getCloudById('missing')).rejects.toThrow(NotFoundException);
    });
  });

  // ── updateCloud ────────────────────────────────────────────────────────────

  describe('updateCloud', () => {
    it('updates and returns cloud with a new version snapshot', async () => {
      const updated = makeCloud({ name: 'Azure' });
      mockRepo.update.mockResolvedValue({ affected: 1 });
      mockRepo.findOne.mockResolvedValue(updated);
      mockAssetVersionsService.saveVersion.mockResolvedValue(undefined);

      const result = await service.updateCloud('cloud-1', { name: 'Azure' }, 'admin');

      expect(mockRepo.update).toHaveBeenCalledWith('cloud-1', {
        name: 'Azure',
        updatedByUserId: 'admin',
      });
      expect(assetVersionsService.saveVersion).toHaveBeenCalledWith(
        'clouds', updated.id, updated, 'admin',
      );
      expect(result.name).toBe('Azure');
    });
  });

  // ── removeCloud ────────────────────────────────────────────────────────────

  describe('removeCloud', () => {
    it('deletes cloud when not in use', async () => {
      cocQbMock.getRawMany.mockResolvedValue([]);
      mockRepo.delete.mockResolvedValue({ affected: 1 });

      await service.removeCloud('cloud-1');

      expect(mockRepo.delete).toHaveBeenCalledWith('cloud-1');
    });

    it('throws HttpException (CONFLICT) when cloud is used by charts', async () => {
      cocQbMock.getRawMany.mockResolvedValue([{ id: 'chart-1', name: 'My Chart' }]);

      await expect(service.removeCloud('cloud-1')).rejects.toThrow(HttpException);
    });

    it('includes usedIn charts in conflict response', async () => {
      cocQbMock.getRawMany.mockResolvedValue([{ id: 'chart-1', name: 'My Chart' }]);

      try {
        await service.removeCloud('cloud-1');
        fail('expected to throw');
      } catch (err: any) {
        expect(err.getStatus()).toBe(409);
        expect(err.getResponse().usedIn[0].kind).toBe('chart');
      }
    });
  });
});
