import { HttpException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { DeviceTypeEntity } from './entities/deviceType.entity';
import { DeviceTypeService } from './deviceType.service';
import { AssetVersionsService } from './assetVersions.service';

const makeType = (overrides: Partial<DeviceTypeEntity> = {}): DeviceTypeEntity =>
  ({
    id: 'type-1',
    name: 'Switch',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    createdByUserId: 'admin',
    updatedByUserId: null,
    ...overrides,
  } as DeviceTypeEntity);

describe('DeviceTypeService', () => {
  let service: DeviceTypeService;
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

  const mockRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(() => qbMock),
  };

  const mockAssetVersionsService = { saveVersion: jest.fn() };
  const mockDataSource = { query: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeviceTypeService,
        { provide: getRepositoryToken(DeviceTypeEntity), useValue: mockRepo },
        { provide: AssetVersionsService, useValue: mockAssetVersionsService },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<DeviceTypeService>(DeviceTypeService);
    repo = module.get(getRepositoryToken(DeviceTypeEntity));
    assetVersionsService = module.get(AssetVersionsService);
    dataSource = module.get(DataSource);
  });

  // ── createDeviceType ───────────────────────────────────────────────────────

  describe('createDeviceType', () => {
    it('creates and saves device type, storing a version snapshot', async () => {
      const dto = { name: 'Switch' };
      const entity = makeType();
      mockRepo.create.mockReturnValue(entity);
      mockRepo.save.mockResolvedValue(entity);
      mockAssetVersionsService.saveVersion.mockResolvedValue(undefined);

      const result = await service.createDeviceType(dto, 'admin');

      expect(mockRepo.create).toHaveBeenCalledWith({ ...dto, createdByUserId: 'admin' });
      expect(mockRepo.save).toHaveBeenCalledWith(entity);
      expect(assetVersionsService.saveVersion).toHaveBeenCalledWith(
        'types', entity.id, entity, 'admin',
      );
      expect(result.name).toBe('Switch');
    });
  });

  // ── listDeviceType ─────────────────────────────────────────────────────────

  describe('listDeviceType', () => {
    it('returns paginated types with defaults', async () => {
      qbMock.getManyAndCount.mockResolvedValue([[makeType()], 1]);

      const result = await service.listDeviceType({});

      expect(result).toEqual({ rows: [makeType()], total: 1 });
      expect(qbMock.orderBy).toHaveBeenCalledWith('v.name', 'ASC');
      expect(qbMock.skip).toHaveBeenCalledWith(0);
      expect(qbMock.take).toHaveBeenCalledWith(25);
    });

    it('applies search filter', async () => {
      qbMock.getManyAndCount.mockResolvedValue([[], 0]);
      await service.listDeviceType({ search: 'router' });
      expect(qbMock.where).toHaveBeenCalledWith('LOWER(v.name) LIKE :s', { s: '%router%' });
    });

    it('falls back to name sort for disallowed sortBy', async () => {
      qbMock.getManyAndCount.mockResolvedValue([[], 0]);
      await service.listDeviceType({ sortBy: 'updatedAt' }); // not in allowed set
      expect(qbMock.orderBy).toHaveBeenCalledWith('v.name', 'ASC');
    });

    it('respects allowed sortBy column', async () => {
      qbMock.getManyAndCount.mockResolvedValue([[], 0]);
      await service.listDeviceType({ sortBy: 'id', sortDir: 'desc' });
      expect(qbMock.orderBy).toHaveBeenCalledWith('v.id', 'DESC');
    });
  });

  // ── getDeviceTypeById ──────────────────────────────────────────────────────

  describe('getDeviceTypeById', () => {
    it('returns device type when found', async () => {
      mockRepo.findOne.mockResolvedValue(makeType());
      const result = await service.getDeviceTypeById('type-1');
      expect(result.id).toBe('type-1');
    });

    it('throws NotFoundException when not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.getDeviceTypeById('missing')).rejects.toThrow(NotFoundException);
    });
  });

  // ── updateDeviceType ───────────────────────────────────────────────────────

  describe('updateDeviceType', () => {
    it('updates and returns the device type with a new version snapshot', async () => {
      const updated = makeType({ name: 'Router' });
      mockRepo.update.mockResolvedValue({ affected: 1 });
      mockRepo.findOne.mockResolvedValue(updated);
      mockAssetVersionsService.saveVersion.mockResolvedValue(undefined);

      const result = await service.updateDeviceType('type-1', { name: 'Router' }, 'admin');

      expect(mockRepo.update).toHaveBeenCalledWith('type-1', {
        name: 'Router',
        updatedByUserId: 'admin',
      });
      expect(assetVersionsService.saveVersion).toHaveBeenCalledWith(
        'types', updated.id, updated, 'admin',
      );
      expect(result.name).toBe('Router');
    });

    it('throws NotFoundException when type does not exist', async () => {
      mockRepo.update.mockResolvedValue({ affected: 0 });
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.updateDeviceType('bad', {}, 'admin')).rejects.toThrow(NotFoundException);
    });
  });

  // ── removeDeviceType ───────────────────────────────────────────────────────

  describe('removeDeviceType', () => {
    it('deletes type when not in use', async () => {
      mockDataSource.query.mockResolvedValue([]);
      mockRepo.delete.mockResolvedValue({ affected: 1 });

      await service.removeDeviceType('type-1');

      expect(mockRepo.delete).toHaveBeenCalledWith('type-1');
    });

    it('throws HttpException (CONFLICT) when type is used by devices', async () => {
      mockDataSource.query.mockResolvedValue([{ id: 'dev-1', name: 'My Switch' }]);

      await expect(service.removeDeviceType('type-1')).rejects.toThrow(HttpException);
    });

    it('includes usedIn devices in conflict response', async () => {
      mockDataSource.query.mockResolvedValue([{ id: 'dev-1', name: 'My Switch' }]);

      try {
        await service.removeDeviceType('type-1');
        fail('expected to throw');
      } catch (err: any) {
        expect(err.getStatus()).toBe(409);
        expect(err.getResponse().usedIn[0].kind).toBe('device');
      }
    });
  });
});
