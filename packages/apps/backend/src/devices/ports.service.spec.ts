import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PortEntity } from './entities/port.entity';
import { PortsService } from './ports.service';

const makePort = (overrides: Partial<PortEntity> = {}): PortEntity =>
  ({
    id: 'port-1',
    name: 'eth0',
    type: 'ethernet' as any,
    deviceId: 'device-1',
    inUse: false,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    createdByUserId: 'admin',
    updatedByUserId: null,
    ...overrides,
  } as PortEntity);

describe('PortsService', () => {
  let service: PortsService;
  let repo: jest.Mocked<any>;

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
    find: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    upsert: jest.fn(),
    createQueryBuilder: jest.fn(() => qbMock),
    manager: {},
  };

  const mockDataSource = {
    getRepository: jest.fn(() => mockRepo),
    transaction: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PortsService,
        { provide: getRepositoryToken(PortEntity), useValue: mockRepo },
        { provide: 'DataSource', useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<PortsService>(PortsService);
    repo = module.get(getRepositoryToken(PortEntity));
  });

  // ── createPort ─────────────────────────────────────────────────────────────────

  describe('createPort', () => {
    it('creates and saves port entity', async () => {
      const dto = { name: 'eth0', type: 'ethernet', deviceId: 'device-1' } as any;
      const entity = makePort();
      repo.create.mockReturnValue(entity);
      repo.save.mockResolvedValue(entity);

      const result = await service.createPort(dto, 'admin');

      expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ createdByUserId: 'admin' }));
      expect(repo.save).toHaveBeenCalledWith(entity);
      expect(result).toEqual(entity);
    });
  });

  // ── listPorts ───────────────────────────────────────────────────────────────────

  describe('listPorts', () => {
    it('returns paginated ports with defaults', async () => {
      const ports = [makePort()];
      qbMock.getManyAndCount.mockResolvedValue([ports, 1]);

      const result = await service.listPorts({});

      expect(result).toEqual({ rows: ports, total: 1 });
      expect(qbMock.orderBy).toHaveBeenCalledWith('v.name', 'ASC');
      expect(qbMock.skip).toHaveBeenCalledWith(0);
      expect(qbMock.take).toHaveBeenCalledWith(25);
    });

    it('filters by search term', async () => {
      qbMock.getManyAndCount.mockResolvedValue([[], 0]);

      await service.listPorts({ search: 'eth' });

      expect(qbMock.where).toHaveBeenCalledWith('LOWER(v.name) LIKE :s', { s: '%eth%' });
    });

    it('respects pagination', async () => {
      qbMock.getManyAndCount.mockResolvedValue([[], 0]);

      await service.listPorts({ page: 3, pageSize: 10 });

      expect(qbMock.skip).toHaveBeenCalledWith(30);
      expect(qbMock.take).toHaveBeenCalledWith(10);
    });
  });

  // ── getPortrById ───────────────────────────────────────────────────────────────

  describe('getPortrById', () => {
    it('returns port when found', async () => {
      const port = makePort();
      repo.findOne.mockResolvedValue(port);

      const result = await service.getPortrById('port-1');

      expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 'port-1' } });
      expect(result).toEqual(port);
    });

    it('throws NotFoundException when not found', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.getPortrById('missing')).rejects.toThrow(NotFoundException);
    });
  });

  // ── updatePort ─────────────────────────────────────────────────────────────────

  describe('updatePort', () => {
    it('updates port and returns refreshed entity', async () => {
      const updated = makePort({ name: 'eth1' });
      repo.update.mockResolvedValue({ affected: 1 });
      repo.findOne.mockResolvedValue(updated);

      const result = await service.updatePort('port-1', { name: 'eth1' } as any, 'admin');

      expect(repo.update).toHaveBeenCalledWith('port-1', expect.objectContaining({ updatedByUserId: 'admin' }));
      expect(result.name).toBe('eth1');
    });

    it('throws NotFoundException when port does not exist', async () => {
      repo.update.mockResolvedValue({ affected: 0 });
      repo.findOne.mockResolvedValue(null);

      await expect(service.updatePort('bad', {} as any, 'admin')).rejects.toThrow(NotFoundException);
    });
  });

  // ── removePort ─────────────────────────────────────────────────────────────────

  describe('removePort', () => {
    it('deletes port by id', async () => {
      repo.delete.mockResolvedValue({ affected: 1 });

      await service.removePort('port-1');

      expect(repo.delete).toHaveBeenCalledWith('port-1');
    });
  });

  // ── upsertPortsForDevice ───────────────────────────────────────────────────────

  describe('upsertPortsForDevice', () => {
    it('returns false when ports is empty', async () => {
      const result = await service.upsertPortsForDevice('device-1', [], 'admin');
      expect(result).toBe(false);
    });

    it('returns false when ports is null', async () => {
      const result = await service.upsertPortsForDevice('device-1', null, 'admin');
      expect(result).toBe(false);
    });

    it('upserts ports and returns true when new ports are added', async () => {
      const newPort = { id: 'port-new', name: 'eth2', type: 'ethernet', createdByUserId: 'admin' };
      // existing returns empty — port is new
      repo.find.mockResolvedValue([]);
      repo.upsert.mockResolvedValue(undefined);

      const result = await service.upsertPortsForDevice('device-1', [newPort as any], 'admin');

      expect(repo.upsert).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('returns false when all ports already exist on same device', async () => {
      const existingPort = { id: 'port-1', name: 'eth0', type: 'ethernet', createdByUserId: 'admin' };
      repo.find.mockResolvedValue([{ id: 'port-1', deviceId: 'device-1' }]);
      repo.upsert.mockResolvedValue(undefined);

      const result = await service.upsertPortsForDevice('device-1', [existingPort as any], 'admin');

      expect(result).toBe(false);
    });

    it('throws BadRequestException when a port belongs to a different device', async () => {
      const port = { id: 'port-1', name: 'eth0', type: 'ethernet', createdByUserId: 'admin' };
      // Port already exists but belongs to device-2
      repo.find.mockResolvedValue([{ id: 'port-1', deviceId: 'device-2' }]);

      await expect(
        service.upsertPortsForDevice('device-1', [port as any], 'admin'),
      ).rejects.toThrow(BadRequestException);
    });

    it('includes conflicting port IDs in error message', async () => {
      const port = { id: 'port-conflict', name: 'eth0', type: 'ethernet', createdByUserId: 'admin' };
      repo.find.mockResolvedValue([{ id: 'port-conflict', deviceId: 'device-99' }]);

      try {
        await service.upsertPortsForDevice('device-1', [port as any], 'admin');
        fail('expected to throw');
      } catch (err: any) {
        expect(err.message).toContain('port-conflict');
      }
    });
  });

  // ── upsertPorts ─────────────────────────────────────────────────────────────────

  describe('upsertPorts', () => {
    it('calls repo.upsert with conflictPaths on id', async () => {
      repo.upsert.mockResolvedValue(undefined);
      const ports = [{ id: 'port-1', name: 'eth0' }] as Partial<PortEntity>[];

      await service.upsertPorts(ports);

      expect(repo.upsert).toHaveBeenCalledWith(ports, {
        conflictPaths: ['id'],
        skipUpdateIfNoValuesChanged: true,
      });
    });
  });
});
