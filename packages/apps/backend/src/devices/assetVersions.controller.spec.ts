import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AssetVersionsController } from './assetVersions.controller';
import { JwdAuthGuard } from '../auth/guards/jwtAuth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { AssetVersionsService } from './assetVersions.service';
import { DevicesService } from './devices.service';
import { OverlayElementsService } from '../overlayElements/overlayElements.service';
import { ModelsService } from './model.service';
import { VendorsService } from './vendors.service';
import { DeviceTypeService } from './deviceType.service';

const mockAssetVersionsService = {
  listVersions: jest.fn(),
  getVersion: jest.fn(),
};
const mockDevicesService = { updateDevice: jest.fn() };
const mockOverlayElementsService = { update: jest.fn() };
const mockModelsService = { updateModel: jest.fn() };
const mockVendorsService = { updateVendor: jest.fn() };
const mockDeviceTypeService = { updateDeviceType: jest.fn() };

describe('AssetVersionsController', () => {
  let controller: AssetVersionsController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssetVersionsController],
      providers: [
        { provide: AssetVersionsService, useValue: mockAssetVersionsService },
        { provide: DevicesService, useValue: mockDevicesService },
        { provide: OverlayElementsService, useValue: mockOverlayElementsService },
        { provide: ModelsService, useValue: mockModelsService },
        { provide: VendorsService, useValue: mockVendorsService },
        { provide: DeviceTypeService, useValue: mockDeviceTypeService },
      ],
    })
      .overrideGuard(JwdAuthGuard).useValue({ canActivate: () => true })
      .overrideGuard(PermissionsGuard).useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AssetVersionsController>(AssetVersionsController);
  });

  // ── listVersions ───────────────────────────────────────────────────────────

  it('listVersions — delegates to assetVersionsService.listVersions', async () => {
    mockAssetVersionsService.listVersions.mockResolvedValue([]);
    const result = await controller.listVersions('devices', 'asset-1');
    expect(mockAssetVersionsService.listVersions).toHaveBeenCalledWith('devices', 'asset-1');
    expect(result).toEqual([]);
  });

  it('listVersions — throws BadRequestException for invalid kind', () => {
    expect(() => controller.listVersions('invalid', 'asset-1')).toThrow('Invalid asset kind: invalid');
  });

  // ── getVersion ─────────────────────────────────────────────────────────────

  it('getVersion — delegates to assetVersionsService.getVersion', async () => {
    mockAssetVersionsService.getVersion.mockResolvedValue({ snapshot: {} });
    const result = await controller.getVersion('devices', 'asset-1', 'ver-1');
    expect(mockAssetVersionsService.getVersion).toHaveBeenCalledWith('devices', 'asset-1', 'ver-1');
    expect(result).toEqual({ snapshot: {} });
  });

  it('getVersion — throws BadRequestException for invalid kind', () => {
    expect(() => controller.getVersion('unknown', 'asset-1', 'ver-1')).toThrow('Invalid asset kind: unknown');
  });

  // ── rollback ───────────────────────────────────────────────────────────────

  describe('rollback', () => {
    const req = { user: 'user-1' };

    it('devices — calls devicesService.updateDevice with snapshot fields', async () => {
      const snap = { name: 'Router', ipAddress: '1.2.3.4', type: { id: 'dt-1' }, model: { id: 'm-1' } };
      mockAssetVersionsService.getVersion.mockResolvedValue({ snapshot: snap });
      mockDevicesService.updateDevice.mockResolvedValue({ id: 'asset-1' });

      await controller.rollback('devices', 'asset-1', 'ver-1', req);

      expect(mockDevicesService.updateDevice).toHaveBeenCalledWith(
        'asset-1',
        { name: 'Router', ipAddress: '1.2.3.4', typeId: 'dt-1', modelId: 'm-1' },
        'user-1',
      );
    });

    it('overlayElements — calls overlayElementsService.update with snapshot fields', async () => {
      const snap = { name: 'AWS', description: 'Cloud infra', imageUrl: null };
      mockAssetVersionsService.getVersion.mockResolvedValue({ snapshot: snap });
      mockOverlayElementsService.update.mockResolvedValue({ id: 'asset-1' });

      await controller.rollback('overlayElements', 'asset-1', 'ver-1', req);

      expect(mockOverlayElementsService.update).toHaveBeenCalledWith(
        'asset-1',
        { name: 'AWS', description: 'Cloud infra', imageUrl: null },
        'user-1',
      );
    });

    it('models — calls modelsService.updateModel with snapshot fields', async () => {
      const snap = { name: 'Catalyst', vendor: { id: 'v-1' } };
      mockAssetVersionsService.getVersion.mockResolvedValue({ snapshot: snap });
      mockModelsService.updateModel.mockResolvedValue({ id: 'asset-1' });

      await controller.rollback('models', 'asset-1', 'ver-1', req);

      expect(mockModelsService.updateModel).toHaveBeenCalledWith(
        'asset-1',
        { name: 'Catalyst', vendorId: 'v-1' },
        'user-1',
      );
    });

    it('vendors — calls vendorsService.updateVendor with snapshot name', async () => {
      const snap = { name: 'Cisco' };
      mockAssetVersionsService.getVersion.mockResolvedValue({ snapshot: snap });
      mockVendorsService.updateVendor.mockResolvedValue({ id: 'asset-1' });

      await controller.rollback('vendors', 'asset-1', 'ver-1', req);

      expect(mockVendorsService.updateVendor).toHaveBeenCalledWith('asset-1', { name: 'Cisco' }, 'user-1');
    });

    it('types — calls deviceTypeService.updateDeviceType with snapshot name', async () => {
      const snap = { name: 'Switch' };
      mockAssetVersionsService.getVersion.mockResolvedValue({ snapshot: snap });
      mockDeviceTypeService.updateDeviceType.mockResolvedValue({ id: 'asset-1' });

      await controller.rollback('types', 'asset-1', 'ver-1', req);

      expect(mockDeviceTypeService.updateDeviceType).toHaveBeenCalledWith('asset-1', { name: 'Switch' }, 'user-1');
    });

    it('throws BadRequestException for invalid kind', async () => {
      await expect(controller.rollback('bad', 'asset-1', 'ver-1', req)).rejects.toThrow(BadRequestException);
    });
  });
});
