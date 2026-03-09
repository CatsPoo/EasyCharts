import { Test, TestingModule } from '@nestjs/testing';
import { VendorsController } from './vendors.controller';
import { VendorsService } from './vendors.service';
import { JwdAuthGuard } from '../auth/guards/jwtAuth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';

const mockService = {
  createVendor: jest.fn(),
  listVendors: jest.fn(),
  getVendorById: jest.fn(),
  updateVendor: jest.fn(),
  removeVendor: jest.fn(),
};

describe('VendorsController', () => {
  let controller: VendorsController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VendorsController],
      providers: [{ provide: VendorsService, useValue: mockService }],
    })
      .overrideGuard(JwdAuthGuard).useValue({ canActivate: () => true })
      .overrideGuard(PermissionsGuard).useValue({ canActivate: () => true })
      .compile();

    controller = module.get<VendorsController>(VendorsController);
  });

  it('create — delegates to vendorsService.createVendor', async () => {
    mockService.createVendor.mockResolvedValue({ id: 'v-1' });
    const result = await controller.create({ name: 'Cisco' } as any, { user: 'user-1' });
    expect(mockService.createVendor).toHaveBeenCalledWith({ name: 'Cisco' }, 'user-1');
    expect(result).toEqual({ id: 'v-1' });
  });

  it('list — delegates to vendorsService.listVendors', async () => {
    mockService.listVendors.mockResolvedValue({ rows: [], total: 0 });
    const result = await controller.list({});
    expect(mockService.listVendors).toHaveBeenCalledWith({});
    expect(result).toEqual({ rows: [], total: 0 });
  });

  it('getById — delegates to vendorsService.getVendorById', async () => {
    mockService.getVendorById.mockResolvedValue({ id: 'v-1' });
    const result = await controller.getById('v-1');
    expect(mockService.getVendorById).toHaveBeenCalledWith('v-1');
    expect(result).toEqual({ id: 'v-1' });
  });

  it('update — delegates to vendorsService.updateVendor', async () => {
    mockService.updateVendor.mockResolvedValue({ id: 'v-1', name: 'HP' });
    const result = await controller.update('v-1', { name: 'HP' } as any, { user: 'user-1' });
    expect(mockService.updateVendor).toHaveBeenCalledWith('v-1', { name: 'HP' }, 'user-1');
    expect(result).toEqual({ id: 'v-1', name: 'HP' });
  });

  it('remove — delegates to vendorsService.removeVendor', async () => {
    mockService.removeVendor.mockResolvedValue(undefined);
    await controller.remove('v-1');
    expect(mockService.removeVendor).toHaveBeenCalledWith('v-1');
  });
});
