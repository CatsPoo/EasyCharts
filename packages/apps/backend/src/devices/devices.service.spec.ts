import { HttpException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { DeviceEntity } from './entities/device.entity';
import { ModelEntity } from './entities/model.entity';
import { DeviceTypeEntity } from './entities/deviceType.entity';
import { DevicesService } from './devices.service';
import { AssetVersionsService } from './assetVersions.service';

const makeVendor = () => ({ id: 'vendor-1', name: 'Cisco' });
const makeModel = () => ({ id: 'model-1', name: 'Catalyst', vendor: makeVendor() } as ModelEntity);
const makeType = () => ({ id: 'type-1', name: 'Switch' } as DeviceTypeEntity);
const makePort = () => ({ id: 'port-1', name: 'eth0', type: 'ethernet', deviceId: 'device-1', inUse: false });

const makeDeviceEntity = (overrides: Partial<DeviceEntity> = {}): DeviceEntity =>
  ({
    id: 'device-1',
    name: 'My Switch',
    ipAddress: '10.0.0.1',
    model: makeModel(),
    type: makeType(),
    ports: [makePort()],
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    createdByUserId: 'admin',
    updatedByUserId: null,
    ...overrides,
  } as DeviceEntity);

describe('DevicesService', () => {
  let service: DevicesService;
  let devicesRepo: jest.Mocked<any>;
  let modelsRepo: jest.Mocked<any>;
  let deviceTypesRepo: jest.Mocked<any>;
  let assetVersionsService: jest.Mocked<any>;
  let dataSource: jest.Mocked<any>;

  const qbMock = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
    innerJoin: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getRawMany: jest.fn(),
  };

  const mockDevicesRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(() => qbMock),
  };

  const mockModelsRepo = { findOne: jest.fn() };
  const mockDeviceTypesRepo = { findOne: jest.fn() };
  const mockAssetVersionsService = { saveVersion: jest.fn() };

  const repoQbMock = {
    innerJoin: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getRawMany: jest.fn(),
  };

  const mockDataSource = {
    getRepository: jest.fn(() => ({ createQueryBuilder: jest.fn(() => repoQbMock) })),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DevicesService,
        { provide: getRepositoryToken(DeviceEntity), useValue: mockDevicesRepo },
        { provide: getRepositoryToken(ModelEntity), useValue: mockModelsRepo },
        { provide: getRepositoryToken(DeviceTypeEntity), useValue: mockDeviceTypesRepo },
        { provide: AssetVersionsService, useValue: mockAssetVersionsService },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<DevicesService>(DevicesService);
    devicesRepo = module.get(getRepositoryToken(DeviceEntity));
    modelsRepo = module.get(getRepositoryToken(ModelEntity));
    deviceTypesRepo = module.get(getRepositoryToken(DeviceTypeEntity));
    assetVersionsService = module.get(AssetVersionsService);
    dataSource = module.get(DataSource);
  });

  // ── convertDeviceEntity ────────────────────────────────────────────────────────

  describe('convertDeviceEntity', () => {
    it('maps entity to Device shape', () => {
      const entity = makeDeviceEntity();
      const result = service.convertDeviceEntity(entity);

      expect(result.id).toBe('device-1');
      expect(result.name).toBe('My Switch');
      expect(result.vendor).toEqual(makeVendor());
      expect(result.model).toEqual(makeModel());
      expect(result.ports).toHaveLength(1);
    });

    it('returns empty ports array when ports is undefined', () => {
      const entity = makeDeviceEntity({ ports: undefined as any });
      const result = service.convertDeviceEntity(entity);
      expect(result.ports).toEqual([]);
    });
  });

  // ── createDevice ───────────────────────────────────────────────────────────────

  describe('createDevice', () => {
    const dto = { name: 'My Switch', typeId: 'type-1', modelId: 'model-1', ipAddress: '10.0.0.1' };

    it('creates device, saves version, and returns converted entity', async () => {
      const entity = makeDeviceEntity();
      deviceTypesRepo.findOne.mockResolvedValue(makeType());
      modelsRepo.findOne.mockResolvedValue(makeModel());
      devicesRepo.create.mockReturnValue(entity);
      devicesRepo.save.mockResolvedValue(entity);
      mockAssetVersionsService.saveVersion.mockResolvedValue(undefined);

      const result = await service.createDevice(dto, 'admin');

      expect(deviceTypesRepo.findOne).toHaveBeenCalledWith({ where: { id: 'type-1' } });
      expect(modelsRepo.findOne).toHaveBeenCalledWith({ where: { id: 'model-1' }, relations: ['vendor'] });
      expect(assetVersionsService.saveVersion).toHaveBeenCalledWith('devices', result.id, result, 'admin');
      expect(result.name).toBe('My Switch');
    });

    it('throws NotFoundException when type not found', async () => {
      deviceTypesRepo.findOne.mockResolvedValue(null);

      await expect(service.createDevice(dto, 'admin')).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when model not found', async () => {
      deviceTypesRepo.findOne.mockResolvedValue(makeType());
      modelsRepo.findOne.mockResolvedValue(null);

      await expect(service.createDevice(dto, 'admin')).rejects.toThrow(NotFoundException);
    });
  });

  // ── getDeviceById ──────────────────────────────────────────────────────────────

  describe('getDeviceById', () => {
    it('returns converted device when found', async () => {
      devicesRepo.findOne.mockResolvedValue(makeDeviceEntity());

      const result = await service.getDeviceById('device-1');
      expect(result.id).toBe('device-1');
    });

    it('throws NotFoundException when device does not exist', async () => {
      devicesRepo.findOne.mockResolvedValue(null);

      await expect(service.getDeviceById('missing')).rejects.toThrow(NotFoundException);
    });
  });

  // ── listDevices ────────────────────────────────────────────────────────────────

  describe('listDevices', () => {
    it('returns paginated rows and total count', async () => {
      const entity = makeDeviceEntity();
      qbMock.getManyAndCount.mockResolvedValue([[entity], 1]);

      const result = await service.listDevices({ page: 0, pageSize: 10 } as any);

      expect(qbMock.skip).toHaveBeenCalledWith(0);
      expect(qbMock.take).toHaveBeenCalledWith(10);
      expect(result.rows).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('computes correct skip for page > 0', async () => {
      qbMock.getManyAndCount.mockResolvedValue([[], 0]);

      await service.listDevices({ page: 2, pageSize: 5 } as any);

      expect(qbMock.skip).toHaveBeenCalledWith(10);
      expect(qbMock.take).toHaveBeenCalledWith(5);
    });

    it('applies search filter when q.search is provided', async () => {
      qbMock.getManyAndCount.mockResolvedValue([[], 0]);

      await service.listDevices({ search: 'switch' } as any);

      expect(qbMock.andWhere).toHaveBeenCalledWith(
        'LOWER(d.name) LIKE :s',
        { s: '%switch%' },
      );
    });

    it('does not apply search filter when q.search is blank', async () => {
      qbMock.getManyAndCount.mockResolvedValue([[], 0]);

      await service.listDevices({ search: '   ' } as any);

      expect(qbMock.andWhere).not.toHaveBeenCalled();
    });

    it('uses default sort (d.name ASC) when sortBy is not provided', async () => {
      qbMock.getManyAndCount.mockResolvedValue([[], 0]);

      await service.listDevices({} as any);

      expect(qbMock.orderBy).toHaveBeenCalledWith('d.name', 'ASC');
    });

    it('maps sortBy=vendor to v.name column', async () => {
      qbMock.getManyAndCount.mockResolvedValue([[], 0]);

      await service.listDevices({ sortBy: 'vendor', sortDir: 'desc' } as any);

      expect(qbMock.orderBy).toHaveBeenCalledWith('v.name', 'DESC');
    });

    it('returns empty rows and zero total when no devices found', async () => {
      qbMock.getManyAndCount.mockResolvedValue([[], 0]);

      const result = await service.listDevices({} as any);

      expect(result.rows).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  // ── getAllDevices ──────────────────────────────────────────────────────────────

  describe('getAllDevices', () => {
    it('returns all devices converted', async () => {
      devicesRepo.find.mockResolvedValue([makeDeviceEntity(), makeDeviceEntity({ id: 'device-2' })]);

      const result = await service.getAllDevices();
      expect(result).toHaveLength(2);
    });

    it('returns empty array when no devices', async () => {
      devicesRepo.find.mockResolvedValue([]);
      expect(await service.getAllDevices()).toEqual([]);
    });
  });

  // ── updateDevice ───────────────────────────────────────────────────────────────

  describe('updateDevice', () => {
    it('updates name and ipAddress and returns updated device', async () => {
      const entity = makeDeviceEntity();
      devicesRepo.findOne.mockResolvedValue(entity);
      devicesRepo.save.mockResolvedValue({ ...entity, name: 'Updated' });
      mockAssetVersionsService.saveVersion.mockResolvedValue(undefined);

      const result = await service.updateDevice('device-1', { name: 'Updated' }, 'admin');

      expect(devicesRepo.save).toHaveBeenCalled();
      expect(assetVersionsService.saveVersion).toHaveBeenCalled();
      expect(result.name).toBe('Updated');
    });

    it('throws NotFoundException when device not found', async () => {
      devicesRepo.findOne.mockResolvedValue(null);

      await expect(service.updateDevice('bad', {}, 'admin')).rejects.toThrow(NotFoundException);
    });

    it('updates type when typeId is provided', async () => {
      const entity = makeDeviceEntity();
      devicesRepo.findOne.mockResolvedValue(entity);
      const newType = { id: 'type-2', name: 'Router' } as DeviceTypeEntity;
      deviceTypesRepo.findOne.mockResolvedValue(newType);
      devicesRepo.save.mockResolvedValue({ ...entity, type: newType });
      mockAssetVersionsService.saveVersion.mockResolvedValue(undefined);

      await service.updateDevice('device-1', { typeId: 'type-2' }, 'admin');

      expect(deviceTypesRepo.findOne).toHaveBeenCalledWith({ where: { id: 'type-2' } });
    });

    it('throws NotFoundException when new type not found', async () => {
      devicesRepo.findOne.mockResolvedValue(makeDeviceEntity());
      deviceTypesRepo.findOne.mockResolvedValue(null);

      await expect(service.updateDevice('device-1', { typeId: 'bad-type' }, 'admin')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('updates model when modelId is provided', async () => {
      const entity = makeDeviceEntity();
      devicesRepo.findOne.mockResolvedValue(entity);
      const newModel = { id: 'model-2', name: 'ISR', vendor: makeVendor() } as ModelEntity;
      modelsRepo.findOne.mockResolvedValue(newModel);
      devicesRepo.save.mockResolvedValue({ ...entity, model: newModel });
      mockAssetVersionsService.saveVersion.mockResolvedValue(undefined);

      await service.updateDevice('device-1', { modelId: 'model-2' }, 'admin');

      expect(modelsRepo.findOne).toHaveBeenCalledWith({ where: { id: 'model-2' }, relations: ['vendor'] });
    });
  });

  // ── removeDevice ───────────────────────────────────────────────────────────────

  describe('removeDevice', () => {
    it('deletes device when not used on any chart', async () => {
      repoQbMock.getRawMany.mockResolvedValue([]);
      devicesRepo.delete.mockResolvedValue({ affected: 1 });

      await service.removeDevice('device-1');

      expect(devicesRepo.delete).toHaveBeenCalledWith('device-1');
    });

    it('throws HttpException (CONFLICT) when device is used on charts', async () => {
      repoQbMock.getRawMany.mockResolvedValue([{ id: 'chart-1', name: 'My Chart' }]);

      await expect(service.removeDevice('device-1')).rejects.toThrow(HttpException);
    });

    it('throws NotFoundException when device does not exist (affected = 0)', async () => {
      repoQbMock.getRawMany.mockResolvedValue([]);
      devicesRepo.delete.mockResolvedValue({ affected: 0 });

      await expect(service.removeDevice('missing')).rejects.toThrow(NotFoundException);
    });

    it('includes usedIn details in conflict exception', async () => {
      repoQbMock.getRawMany.mockResolvedValue([{ id: 'chart-1', name: 'My Chart' }]);

      try {
        await service.removeDevice('device-1');
        fail('expected to throw');
      } catch (err: any) {
        expect(err.getStatus()).toBe(409);
        expect(err.getResponse().usedIn[0].kind).toBe('chart');
      }
    });
  });
});
