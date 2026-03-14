import { HttpException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { VendorEntity } from './entities/vendor.entity';
import { VendorsService } from './vendors.service';
import { AssetVersionsService } from '../assetVersions/assetVersions.service';

const makeVendor = (overrides: Partial<VendorEntity> = {}): VendorEntity =>
  ({
    id: 'vendor-1',
    name: 'Cisco',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    createdByUserId: 'admin',
    updatedByUserId: null,
    ...overrides,
  } as VendorEntity);

describe('VendorsService', () => {
  let service: VendorsService;
  let repo: jest.Mocked<any>;
  let assetVersionsService: jest.Mocked<AssetVersionsService>;

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

  const mockAssetVersionsService = {
    saveVersion: jest.fn(),
  };

  const mockDataSource = {
    query: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VendorsService,
        { provide: getRepositoryToken(VendorEntity), useValue: mockRepo },
        { provide: AssetVersionsService, useValue: mockAssetVersionsService },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<VendorsService>(VendorsService);
    repo = module.get(getRepositoryToken(VendorEntity));
    assetVersionsService = module.get(AssetVersionsService);
  });

  // ── createVendor ─────────────────────────────────────────────────────────────

  describe('createVendor', () => {
    it('creates and returns vendor, saving a version snapshot', async () => {
      const dto = { name: 'Cisco' };
      const entity = makeVendor();
      repo.create.mockReturnValue(entity);
      repo.save.mockResolvedValue(entity);
      mockAssetVersionsService.saveVersion.mockResolvedValue(undefined);

      const result = await service.createVendor(dto, 'admin');

      expect(repo.create).toHaveBeenCalledWith({ ...dto, createdByUserId: 'admin' });
      expect(repo.save).toHaveBeenCalledWith(entity);
      expect(assetVersionsService.saveVersion).toHaveBeenCalledWith(
        'vendors', entity.id, entity, 'admin',
      );
      expect(result).toEqual(entity);
    });
  });

  // ── listVendors ──────────────────────────────────────────────────────────────

  describe('listVendors', () => {
    it('returns paginated vendors with defaults', async () => {
      const vendors = [makeVendor()];
      qbMock.getManyAndCount.mockResolvedValue([vendors, 1]);

      const result = await service.listVendors({});

      expect(result).toEqual({ rows: vendors, total: 1 });
      expect(qbMock.orderBy).toHaveBeenCalledWith('v.name', 'ASC');
      expect(qbMock.skip).toHaveBeenCalledWith(0);
      expect(qbMock.take).toHaveBeenCalledWith(25);
    });

    it('applies search filter when provided', async () => {
      qbMock.getManyAndCount.mockResolvedValue([[], 0]);

      await service.listVendors({ search: 'Juniper', page: 0, pageSize: 10 });

      expect(qbMock.where).toHaveBeenCalledWith('LOWER(v.name) LIKE :s', {
        s: '%juniper%',
      });
    });

    it('respects custom page and pageSize', async () => {
      qbMock.getManyAndCount.mockResolvedValue([[], 0]);

      await service.listVendors({ page: 2, pageSize: 5 });

      expect(qbMock.skip).toHaveBeenCalledWith(10);
      expect(qbMock.take).toHaveBeenCalledWith(5);
    });

    it('sorts by allowed column', async () => {
      qbMock.getManyAndCount.mockResolvedValue([[], 0]);

      await service.listVendors({ sortBy: 'createdAt', sortDir: 'desc' });

      expect(qbMock.orderBy).toHaveBeenCalledWith('v.createdAt', 'DESC');
    });

    it('falls back to name sort for disallowed sortBy', async () => {
      qbMock.getManyAndCount.mockResolvedValue([[], 0]);

      await service.listVendors({ sortBy: 'injected; DROP TABLE vendors' });

      expect(qbMock.orderBy).toHaveBeenCalledWith('v.name', 'ASC');
    });
  });

  // ── getVendorById ─────────────────────────────────────────────────────────────

  describe('getVendorById', () => {
    it('returns vendor when found', async () => {
      const vendor = makeVendor();
      repo.findOne.mockResolvedValue(vendor);

      const result = await service.getVendorById('vendor-1');

      expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 'vendor-1' } });
      expect(result).toEqual(vendor);
    });

    it('throws NotFoundException when not found', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.getVendorById('missing')).rejects.toThrow(NotFoundException);
    });
  });

  // ── updateVendor ──────────────────────────────────────────────────────────────

  describe('updateVendor', () => {
    it('updates vendor and saves a version snapshot', async () => {
      const updated = makeVendor({ name: 'Updated' });
      repo.update.mockResolvedValue({ affected: 1 });
      repo.findOne.mockResolvedValue(updated);
      mockAssetVersionsService.saveVersion.mockResolvedValue(undefined);

      const result = await service.updateVendor('vendor-1', { name: 'Updated' }, 'admin');

      expect(repo.update).toHaveBeenCalledWith('vendor-1', {
        name: 'Updated',
        updatedByUserId: 'admin',
      });
      expect(assetVersionsService.saveVersion).toHaveBeenCalledWith(
        'vendors', updated.id, updated, 'admin',
      );
      expect(result.name).toBe('Updated');
    });

    it('throws NotFoundException when vendor does not exist', async () => {
      repo.update.mockResolvedValue({ affected: 1 });
      repo.findOne.mockResolvedValue(null);

      await expect(service.updateVendor('bad-id', { name: 'X' }, 'admin')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── removeVendor ──────────────────────────────────────────────────────────────

  describe('removeVendor', () => {
    it('deletes vendor when not in use', async () => {
      mockDataSource.query.mockResolvedValue([]);
      repo.delete.mockResolvedValue({ affected: 1 });

      await service.removeVendor('vendor-1');

      expect(repo.delete).toHaveBeenCalledWith('vendor-1');
    });

    it('throws HttpException (CONFLICT) when vendor is referenced by models', async () => {
      mockDataSource.query.mockResolvedValue([{ id: 'model-1', name: 'Catalyst 9300' }]);

      await expect(service.removeVendor('vendor-1')).rejects.toThrow(HttpException);
    });

    it('includes usedIn details in conflict exception', async () => {
      mockDataSource.query.mockResolvedValue([{ id: 'model-1', name: 'Catalyst 9300' }]);

      try {
        await service.removeVendor('vendor-1');
        fail('expected to throw');
      } catch (err: any) {
        expect(err.getStatus()).toBe(409);
        expect(err.getResponse().usedIn).toHaveLength(1);
        expect(err.getResponse().usedIn[0].kind).toBe('model');
      }
    });
  });
});
