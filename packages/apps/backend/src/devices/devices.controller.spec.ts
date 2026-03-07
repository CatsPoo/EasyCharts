import { Test, TestingModule } from '@nestjs/testing';
import { DevicesController } from './devices.controller';
import { DevicesService } from './devices.service';
import { JwdAuthGuard } from '../auth/guards/jwtAuth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';

const mockService = {
  createDevice: jest.fn(),
  listDevices: jest.fn(),
  getDeviceById: jest.fn(),
  updateDevice: jest.fn(),
  removeDevice: jest.fn(),
};

describe('DevicesController', () => {
  let controller: DevicesController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DevicesController],
      providers: [{ provide: DevicesService, useValue: mockService }],
    })
      .overrideGuard(JwdAuthGuard).useValue({ canActivate: () => true })
      .overrideGuard(PermissionsGuard).useValue({ canActivate: () => true })
      .compile();

    controller = module.get<DevicesController>(DevicesController);
  });

  it('create — delegates to devicesService.createDevice', async () => {
    mockService.createDevice.mockResolvedValue({ id: 'dev-1' });
    const result = await controller.create({ name: 'Switch' } as any, { user: 'user-1' });
    expect(mockService.createDevice).toHaveBeenCalledWith({ name: 'Switch' }, 'user-1');
    expect(result).toEqual({ id: 'dev-1' });
  });

  it('list — delegates to devicesService.listDevices', async () => {
    mockService.listDevices.mockResolvedValue({ rows: [], total: 0 });
    const result = await controller.list({});
    expect(mockService.listDevices).toHaveBeenCalledWith({});
    expect(result).toEqual({ rows: [], total: 0 });
  });

  it('getById — delegates to devicesService.getDeviceById', async () => {
    mockService.getDeviceById.mockResolvedValue({ id: 'dev-1' });
    const result = await controller.getById('dev-1');
    expect(mockService.getDeviceById).toHaveBeenCalledWith('dev-1');
    expect(result).toEqual({ id: 'dev-1' });
  });

  it('update — delegates to devicesService.updateDevice', async () => {
    mockService.updateDevice.mockResolvedValue({ id: 'dev-1', name: 'Router' });
    const result = await controller.update('dev-1', { name: 'Router' } as any, { user: 'user-1' });
    expect(mockService.updateDevice).toHaveBeenCalledWith('dev-1', { name: 'Router' }, 'user-1');
    expect(result).toEqual({ id: 'dev-1', name: 'Router' });
  });

  it('remove — delegates to devicesService.removeDevice', async () => {
    mockService.removeDevice.mockResolvedValue(undefined);
    await controller.remove('dev-1');
    expect(mockService.removeDevice).toHaveBeenCalledWith('dev-1');
  });
});
