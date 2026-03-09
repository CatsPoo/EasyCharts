import { HttpException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ModelEntity } from './entities/model.entity';
import { VendorEntity } from '../vendors/entities/vendor.entity';
import { ModelsService } from './model.service';
import { AssetVersionsService } from '../assetVersions/assetVersions.service';

const makeVendor = (): VendorEntity =>
  ({ id: 'vendor-1', name: 'Cisco' } as VendorEntity);

const makeModel = (overrides: Partial<ModelEntity> = {}): ModelEntity =>
  ({
    id: 'model-1',
    name: 'Catalyst 9300',
    vendor: makeVendor(),
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    createdByUserId: 'admin',
    updatedByUserId: null,
    ...overrides,
  } as ModelEntity);

describe('ModelsService', () => {
  let service: ModelsService;
  let modelsRepo: jest.Mocked<any>;
  let vendorRepo: jest.Mocked<any>;
  let assetVersionsService: jest.Mocked<any>;
  let dataSource: jest.Mocked<any>;

  const qbMock = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
  };

  const mockModelsRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(() => qbMock),
  };

  const mockVendorRepo = { findOne: jest.fn() };
  const mockAssetVersionsService = { saveVersion: jest.fn() };
  const mockDataSource = { query: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ModelsService,
        { provide: getRepositoryToken(ModelEntity), useValue: mockModelsRepo },
        { provide: getRepositoryToken(VendorEntity), useValue: mockVendorRepo },
        { provide: AssetVersionsService, useValue: mockAssetVersionsService },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<ModelsService>(ModelsService);
    modelsRepo = module.get(getRepositoryToken(ModelEntity));
    vendorRepo = module.get(getRepositoryToken(VendorEntity));
    assetVersionsService = module.get(AssetVersionsService);
    dataSource = module.get(DataSource);
  });

  // ── createModel ────────────────────────────────────────────────────────────

  describe('createModel', () => {
    it('creates model without vendor when vendorId is omitted', async () => {
      const dto = { name: 'Generic Model' };
      const entity = makeModel({ vendor: undefined as any });
      mockModelsRepo.create.mockReturnValue(entity);
      mockModelsRepo.save.mockResolvedValue(entity);
      mockAssetVersionsService.saveVersion.mockResolvedValue(undefined);

      const result = await service.createModel(dto, 'admin');

      expect(vendorRepo.findOne).not.toHaveBeenCalled();
      expect(mockModelsRepo.save).toHaveBeenCalled();
      expect(assetVersionsService.saveVersion).toHaveBeenCalledWith(
        'models', entity.id, entity, 'admin',
      );
      expect(result.name).toBe('Catalyst 9300');
    });

    it('attaches vendor when vendorId is provided', async () => {
      const dto = { name: 'Catalyst 9300', vendorId: 'vendor-1' };
      const vendor = makeVendor();
      const entity = makeModel();
      mockModelsRepo.create.mockReturnValue(entity);
      mockVendorRepo.findOne.mockResolvedValue(vendor);
      mockModelsRepo.save.mockResolvedValue(entity);
      mockAssetVersionsService.saveVersion.mockResolvedValue(undefined);

      await service.createModel(dto, 'admin');

      expect(mockVendorRepo.findOne).toHaveBeenCalledWith({ where: { id: 'vendor-1' } });
    });

    it('throws NotFoundException when vendor does not exist', async () => {
      mockModelsRepo.create.mockReturnValue(makeModel());
      mockVendorRepo.findOne.mockResolvedValue(null);

      await expect(service.createModel({ name: 'X', vendorId: 'bad' }, 'admin')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── listModels ─────────────────────────────────────────────────────────────

  describe('listModels', () => {
    it('returns paginated models with defaults', async () => {
      const models = [makeModel()];
      qbMock.getManyAndCount.mockResolvedValue([models, 1]);

      const result = await service.listModels({});

      expect(result).toEqual({ rows: models, total: 1 });
      expect(qbMock.orderBy).toHaveBeenCalledWith('m.name', 'ASC');
    });

    it('filters by search term', async () => {
      qbMock.getManyAndCount.mockResolvedValue([[], 0]);
      await service.listModels({ search: 'catalyst' });
      expect(qbMock.andWhere).toHaveBeenCalledWith('LOWER(m.name) LIKE :s', {
        s: '%catalyst%',
      });
    });

    it('filters by vendorId', async () => {
      qbMock.getManyAndCount.mockResolvedValue([[], 0]);
      await service.listModels({ vendorId: 'vendor-1' });
      expect(qbMock.andWhere).toHaveBeenCalledWith('v.id = :vid', { vid: 'vendor-1' });
    });

    it('uses allowed sortBy column', async () => {
      qbMock.getManyAndCount.mockResolvedValue([[], 0]);
      await service.listModels({ sortBy: 'createdAt', sortDir: 'desc' });
      expect(qbMock.orderBy).toHaveBeenCalledWith('m.createdAt', 'DESC');
    });

    it('falls back to name for disallowed sortBy', async () => {
      qbMock.getManyAndCount.mockResolvedValue([[], 0]);
      await service.listModels({ sortBy: 'vendorName' });
      expect(qbMock.orderBy).toHaveBeenCalledWith('m.name', 'ASC');
    });
  });

  // ── getModelById ───────────────────────────────────────────────────────────

  describe('getModelById', () => {
    it('returns model when found', async () => {
      mockModelsRepo.findOne.mockResolvedValue(makeModel());
      const result = await service.getModelById('model-1');
      expect(result.id).toBe('model-1');
    });

    it('throws NotFoundException when not found', async () => {
      mockModelsRepo.findOne.mockResolvedValue(null);
      await expect(service.getModelById('bad')).rejects.toThrow(NotFoundException);
    });
  });

  // ── updateModel ────────────────────────────────────────────────────────────

  describe('updateModel', () => {
    it('updates model name', async () => {
      const entity = makeModel();
      mockModelsRepo.findOne.mockResolvedValue(entity);
      mockModelsRepo.save.mockResolvedValue({ ...entity, name: 'Updated' });
      mockAssetVersionsService.saveVersion.mockResolvedValue(undefined);

      const result = await service.updateModel('model-1', { name: 'Updated' }, 'admin');

      expect(mockModelsRepo.save).toHaveBeenCalled();
      expect(assetVersionsService.saveVersion).toHaveBeenCalled();
      expect(result.name).toBe('Updated');
    });

    it('throws NotFoundException when model does not exist', async () => {
      mockModelsRepo.findOne.mockResolvedValue(null);
      await expect(service.updateModel('bad', { name: 'X' }, 'admin')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('updates vendor when vendorId is provided', async () => {
      const entity = makeModel();
      mockModelsRepo.findOne.mockResolvedValue(entity);
      const newVendor = { id: 'vendor-2', name: 'Juniper' } as VendorEntity;
      mockVendorRepo.findOne.mockResolvedValue(newVendor);
      mockModelsRepo.save.mockResolvedValue({ ...entity, vendor: newVendor });
      mockAssetVersionsService.saveVersion.mockResolvedValue(undefined);

      await service.updateModel('model-1', { vendorId: 'vendor-2' }, 'admin');

      expect(mockVendorRepo.findOne).toHaveBeenCalledWith({ where: { id: 'vendor-2' } });
    });

    it('throws NotFoundException when new vendor does not exist', async () => {
      mockModelsRepo.findOne.mockResolvedValue(makeModel());
      mockVendorRepo.findOne.mockResolvedValue(null);

      await expect(
        service.updateModel('model-1', { vendorId: 'bad-vendor' }, 'admin'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── removeModel ────────────────────────────────────────────────────────────

  describe('removeModel', () => {
    it('deletes model when not referenced by any devices', async () => {
      mockDataSource.query.mockResolvedValue([]);
      mockModelsRepo.delete.mockResolvedValue({ affected: 1 });

      await service.removeModel('model-1');

      expect(mockModelsRepo.delete).toHaveBeenCalledWith('model-1');
    });

    it('throws HttpException (CONFLICT) when model is used by devices', async () => {
      mockDataSource.query.mockResolvedValue([{ id: 'dev-1', name: 'My Switch' }]);

      await expect(service.removeModel('model-1')).rejects.toThrow(HttpException);
    });

    it('includes usedIn devices in conflict response with kind=device', async () => {
      mockDataSource.query.mockResolvedValue([{ id: 'dev-1', name: 'My Switch' }]);

      try {
        await service.removeModel('model-1');
        fail('expected to throw');
      } catch (err: any) {
        expect(err.getStatus()).toBe(409);
        expect(err.getResponse().usedIn[0].kind).toBe('device');
      }
    });
  });
});
