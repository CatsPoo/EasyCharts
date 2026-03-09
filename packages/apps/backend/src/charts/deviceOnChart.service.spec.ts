import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { DevicesOnChartService } from './deviceOnChart.service';
import { DevicesService } from '../devices/devices.service';
import { PortsOnChartService } from './portsOnChart.service';
import { PortsService } from '../devices/ports.service';
import { AssetVersionsService } from '../assetVersions/assetVersions.service';
import { DeviceOnChartEntity } from './entities/deviceOnChart.entity';
import { PortOnChartEntity } from './entities/portOnChart.entity';
import { DeviceEntity } from '../devices/entities/device.entity';
import { PortEntity } from '../devices/entities/port.entity';

describe('DevicesOnChartService', () => {
  let service: DevicesOnChartService;

  const mockDevicesService = {
    convertDeviceEntity: jest.fn((d) => ({ id: d.id, name: d.name })),
  };

  const mockPortsOnChartService = {
    rowsToHandles: jest.fn(() => ({ left: [], right: [], top: [], bottom: [] })),
    handlesToRows: jest.fn(() => []),
  };

  const mockPortsService = {
    upsertPortsForDevice: jest.fn().mockResolvedValue(false),
  };

  const mockAssetVersionsService = {
    saveVersion: jest.fn().mockResolvedValue(undefined),
  };

  const docRepoMock = {
    upsert: jest.fn().mockResolvedValue(undefined),
    find: jest.fn().mockResolvedValue([]),
    remove: jest.fn().mockResolvedValue(undefined),
  };

  const pocRepoMock = {
    delete: jest.fn().mockResolvedValue(undefined),
    insert: jest.fn().mockResolvedValue(undefined),
  };

  const deviceRepoMock = {
    count: jest.fn().mockResolvedValue(1),
  };

  const portRepoMock = {
    count: jest.fn().mockResolvedValue(0),
  };

  const managerMock = {
    getRepository: jest.fn((entity) => {
      if (entity === DeviceOnChartEntity) return docRepoMock;
      if (entity === PortOnChartEntity) return pocRepoMock;
      if (entity === DeviceEntity) return deviceRepoMock;
      if (entity === PortEntity) return portRepoMock;
      return {};
    }),
  } as unknown as EntityManager;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DevicesOnChartService,
        { provide: DevicesService, useValue: mockDevicesService },
        { provide: PortsOnChartService, useValue: mockPortsOnChartService },
        { provide: PortsService, useValue: mockPortsService },
        { provide: AssetVersionsService, useValue: mockAssetVersionsService },
      ],
    }).compile();

    service = module.get<DevicesOnChartService>(DevicesOnChartService);
  });

  // ── convertDeviceOnChartEntity ─────────────────────────────────────────────

  describe('convertDeviceOnChartEntity', () => {
    it('converts entity to DeviceOnChart shape', async () => {
      const entity = {
        chartId: 'chart-1',
        position: { x: 10, y: 20 },
        device: { id: 'dev-1', name: 'Switch' },
        portPlacements: [],
      } as any;

      const result = await service.convertDeviceOnChartEntity(entity);

      expect(mockDevicesService.convertDeviceEntity).toHaveBeenCalledWith(entity.device);
      expect(result.chartId).toBe('chart-1');
      expect(result.position).toEqual({ x: 10, y: 20 });
    });

    it('calls rowsToHandles with portPlacements', async () => {
      const entity = {
        chartId: 'chart-1',
        position: { x: 0, y: 0 },
        device: { id: 'dev-1' },
        portPlacements: [{ side: 'left', port: { id: 'p1' } }],
      } as any;

      await service.convertDeviceOnChartEntity(entity);

      expect(mockPortsOnChartService.rowsToHandles).toHaveBeenCalledWith(entity.portPlacements);
    });

    it('falls back to empty array when portPlacements is null', async () => {
      const entity = {
        chartId: 'chart-1',
        position: { x: 0, y: 0 },
        device: { id: 'dev-1' },
        portPlacements: null,
      } as any;

      await service.convertDeviceOnChartEntity(entity);

      expect(mockPortsOnChartService.rowsToHandles).toHaveBeenCalledWith([]);
    });
  });

  // ── syncPlacementsAndHandles ───────────────────────────────────────────────

  describe('syncPlacementsAndHandles', () => {
    const basePlacement = {
      device: { id: 'dev-1', ports: [] },
      position: { x: 10, y: 20 },
      handles: undefined,
    };

    it('upserts placements when devices exist', async () => {
      deviceRepoMock.count.mockResolvedValue(1);

      await service.syncPlacementsAndHandles(managerMock, 'chart-1', [basePlacement] as any, 'user-1');

      expect(docRepoMock.upsert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ chartId: 'chart-1', deviceId: 'dev-1' }),
        ]),
        ['chartId', 'deviceId'],
      );
    });

    it('throws NotFoundException when device does not exist', async () => {
      deviceRepoMock.count.mockResolvedValue(0);

      await expect(
        service.syncPlacementsAndHandles(managerMock, 'chart-1', [basePlacement] as any, 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('skips device validation when placements array is empty', async () => {
      await service.syncPlacementsAndHandles(managerMock, 'chart-1', [], 'user-1');

      expect(deviceRepoMock.count).not.toHaveBeenCalled();
    });

    it('removes placements not in desired list', async () => {
      deviceRepoMock.count.mockResolvedValue(1);
      docRepoMock.find.mockResolvedValue([
        { deviceId: 'dev-1' },
        { deviceId: 'dev-99' }, // stale
      ]);

      await service.syncPlacementsAndHandles(managerMock, 'chart-1', [basePlacement] as any, 'user-1');

      expect(docRepoMock.remove).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ deviceId: 'dev-99' })]),
      );
    });

    it('does not call remove when no stale placements exist', async () => {
      deviceRepoMock.count.mockResolvedValue(1);
      docRepoMock.find.mockResolvedValue([{ deviceId: 'dev-1' }]);

      await service.syncPlacementsAndHandles(managerMock, 'chart-1', [basePlacement] as any, 'user-1');

      expect(docRepoMock.remove).not.toHaveBeenCalled();
    });

    it('saves asset version snapshot when ports changed', async () => {
      deviceRepoMock.count.mockResolvedValue(1);
      mockPortsService.upsertPortsForDevice.mockResolvedValue(true);

      await service.syncPlacementsAndHandles(managerMock, 'chart-1', [basePlacement] as any, 'user-1');

      expect(mockAssetVersionsService.saveVersion).toHaveBeenCalledWith(
        'devices', 'dev-1', basePlacement.device, 'user-1',
      );
    });

    it('does not save asset version when ports did not change', async () => {
      deviceRepoMock.count.mockResolvedValue(1);
      mockPortsService.upsertPortsForDevice.mockResolvedValue(false);

      await service.syncPlacementsAndHandles(managerMock, 'chart-1', [basePlacement] as any, 'user-1');

      expect(mockAssetVersionsService.saveVersion).not.toHaveBeenCalled();
    });

    it('inserts handles for device', async () => {
      deviceRepoMock.count.mockResolvedValue(1);
      mockPortsOnChartService.handlesToRows.mockReturnValue([
        { chartId: 'chart-1', deviceId: 'dev-1', portId: 'port-1', side: 'left' },
      ]);
      portRepoMock.count.mockResolvedValue(1);

      await service.syncPlacementsAndHandles(managerMock, 'chart-1', [basePlacement] as any, 'user-1');

      expect(pocRepoMock.delete).toHaveBeenCalledWith({ chartId: 'chart-1', deviceId: 'dev-1' });
      expect(pocRepoMock.insert).toHaveBeenCalled();
    });

    it('throws BadRequestException when port does not belong to device', async () => {
      deviceRepoMock.count.mockResolvedValue(1);
      mockPortsOnChartService.handlesToRows.mockReturnValue([
        { chartId: 'chart-1', deviceId: 'dev-1', portId: 'port-99', side: 'left' },
      ]);
      portRepoMock.count.mockResolvedValue(0); // port not found on device

      await expect(
        service.syncPlacementsAndHandles(managerMock, 'chart-1', [basePlacement] as any, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('skips port validation when no desired rows', async () => {
      deviceRepoMock.count.mockResolvedValue(1);
      mockPortsOnChartService.handlesToRows.mockReturnValue([]);

      await service.syncPlacementsAndHandles(managerMock, 'chart-1', [basePlacement] as any, 'user-1');

      expect(portRepoMock.count).not.toHaveBeenCalled();
    });
  });
});
