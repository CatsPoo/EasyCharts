import { Test, TestingModule } from '@nestjs/testing';
import { PortsController } from './ports.controller';
import { PortsService } from './ports.service';
import { DevicesService } from './devices.service';
import { AssetVersionsService } from './assetVersions.service';
import { JwdAuthGuard } from '../auth/guards/jwtAuth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';

const mockPortsService = {
  createPort: jest.fn(),
  listPorts: jest.fn(),
  getPortrById: jest.fn(),
  updatePort: jest.fn(),
  removePort: jest.fn(),
};

const mockDevicesService = {
  getDeviceById: jest.fn(),
};

const mockAssetVersionsService = {
  saveVersion: jest.fn(),
};

describe('PortsController', () => {
  let controller: PortsController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PortsController],
      providers: [
        { provide: PortsService, useValue: mockPortsService },
        { provide: DevicesService, useValue: mockDevicesService },
        { provide: AssetVersionsService, useValue: mockAssetVersionsService },
      ],
    })
      .overrideGuard(JwdAuthGuard).useValue({ canActivate: () => true })
      .overrideGuard(PermissionsGuard).useValue({ canActivate: () => true })
      .compile();

    controller = module.get<PortsController>(PortsController);
  });

  // ── create ─────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('creates port, fetches device, saves version snapshot, returns port', async () => {
      const port = { id: 'p-1', deviceId: 'dev-1', name: 'eth0' };
      const device = { id: 'dev-1', name: 'Switch' };
      mockPortsService.createPort.mockResolvedValue(port);
      mockDevicesService.getDeviceById.mockResolvedValue(device);
      mockAssetVersionsService.saveVersion.mockResolvedValue(undefined);

      const result = await controller.create({ name: 'eth0', deviceId: 'dev-1' } as any, { user: 'user-1' });

      expect(mockPortsService.createPort).toHaveBeenCalledWith({ name: 'eth0', deviceId: 'dev-1' }, 'user-1');
      expect(mockDevicesService.getDeviceById).toHaveBeenCalledWith('dev-1');
      expect(mockAssetVersionsService.saveVersion).toHaveBeenCalledWith('devices', 'dev-1', device, 'user-1');
      expect(result).toEqual(port);
    });
  });

  // ── list ───────────────────────────────────────────────────────────────────

  it('list — delegates to portsService.listPorts', async () => {
    mockPortsService.listPorts.mockResolvedValue({ rows: [], total: 0 });
    const result = await controller.list({});
    expect(mockPortsService.listPorts).toHaveBeenCalledWith({});
    expect(result).toEqual({ rows: [], total: 0 });
  });

  it('getById — delegates to portsService.getPortrById', async () => {
    mockPortsService.getPortrById.mockResolvedValue({ id: 'p-1' });
    const result = await controller.getById('p-1');
    expect(mockPortsService.getPortrById).toHaveBeenCalledWith('p-1');
    expect(result).toEqual({ id: 'p-1' });
  });

  // ── update ─────────────────────────────────────────────────────────────────

  describe('update', () => {
    it('updates port, fetches device, saves version snapshot, returns port', async () => {
      const port = { id: 'p-1', deviceId: 'dev-1', name: 'eth1' };
      const device = { id: 'dev-1', name: 'Switch' };
      mockPortsService.updatePort.mockResolvedValue(port);
      mockDevicesService.getDeviceById.mockResolvedValue(device);
      mockAssetVersionsService.saveVersion.mockResolvedValue(undefined);

      const result = await controller.update('p-1', { name: 'eth1' } as any, { user: 'user-1' });

      expect(mockPortsService.updatePort).toHaveBeenCalledWith('p-1', { name: 'eth1' }, 'user-1');
      expect(mockDevicesService.getDeviceById).toHaveBeenCalledWith('dev-1');
      expect(mockAssetVersionsService.saveVersion).toHaveBeenCalledWith('devices', 'dev-1', device, 'user-1');
      expect(result).toEqual(port);
    });
  });

  // ── remove ─────────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('fetches port, deletes port, fetches device, saves version snapshot', async () => {
      const port = { id: 'p-1', deviceId: 'dev-1' };
      const device = { id: 'dev-1' };
      mockPortsService.getPortrById.mockResolvedValue(port);
      mockPortsService.removePort.mockResolvedValue(undefined);
      mockDevicesService.getDeviceById.mockResolvedValue(device);
      mockAssetVersionsService.saveVersion.mockResolvedValue(undefined);

      await controller.remove('p-1', { user: 'user-1' });

      expect(mockPortsService.getPortrById).toHaveBeenCalledWith('p-1');
      expect(mockPortsService.removePort).toHaveBeenCalledWith('p-1');
      expect(mockDevicesService.getDeviceById).toHaveBeenCalledWith('dev-1');
      expect(mockAssetVersionsService.saveVersion).toHaveBeenCalledWith('devices', 'dev-1', device, 'user-1');
    });
  });
});
