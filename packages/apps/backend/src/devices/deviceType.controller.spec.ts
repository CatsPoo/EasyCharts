import { Test, TestingModule } from '@nestjs/testing';
import { DeviceTypeController } from './deviceType.controller';
import { DeviceTypeService } from './deviceType.service';
import { JwdAuthGuard } from '../auth/guards/jwtAuth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';

const mockService = {
  createDeviceType: jest.fn(),
  listDeviceType: jest.fn(),
  getDeviceTypeById: jest.fn(),
  updateDeviceType: jest.fn(),
  removeDeviceType: jest.fn(),
};

describe('DeviceTypeController', () => {
  let controller: DeviceTypeController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DeviceTypeController],
      providers: [{ provide: DeviceTypeService, useValue: mockService }],
    })
      .overrideGuard(JwdAuthGuard).useValue({ canActivate: () => true })
      .overrideGuard(PermissionsGuard).useValue({ canActivate: () => true })
      .compile();

    controller = module.get<DeviceTypeController>(DeviceTypeController);
  });

  it('create — delegates to deviceTypeService.createDeviceType', async () => {
    mockService.createDeviceType.mockResolvedValue({ id: 'dt-1' });
    const result = await controller.create({ name: 'Switch' } as any, { user: 'user-1' });
    expect(mockService.createDeviceType).toHaveBeenCalledWith({ name: 'Switch' }, 'user-1');
    expect(result).toEqual({ id: 'dt-1' });
  });

  it('list — delegates to deviceTypeService.listDeviceType', async () => {
    mockService.listDeviceType.mockResolvedValue({ rows: [], total: 0 });
    const result = await controller.list({});
    expect(mockService.listDeviceType).toHaveBeenCalledWith({});
    expect(result).toEqual({ rows: [], total: 0 });
  });

  it('getById — delegates to deviceTypeService.getDeviceTypeById', async () => {
    mockService.getDeviceTypeById.mockResolvedValue({ id: 'dt-1' });
    const result = await controller.getById('dt-1');
    expect(mockService.getDeviceTypeById).toHaveBeenCalledWith('dt-1');
    expect(result).toEqual({ id: 'dt-1' });
  });

  it('update — delegates to deviceTypeService.updateDeviceType', async () => {
    mockService.updateDeviceType.mockResolvedValue({ id: 'dt-1', name: 'Router' });
    const result = await controller.update('dt-1', { name: 'Router' } as any, { user: 'user-1' });
    expect(mockService.updateDeviceType).toHaveBeenCalledWith('dt-1', { name: 'Router' }, 'user-1');
    expect(result).toEqual({ id: 'dt-1', name: 'Router' });
  });

  it('remove — delegates to deviceTypeService.removeDeviceType', async () => {
    mockService.removeDeviceType.mockResolvedValue(undefined);
    await controller.remove('dt-1');
    expect(mockService.removeDeviceType).toHaveBeenCalledWith('dt-1');
  });
});
