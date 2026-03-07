import { Test, TestingModule } from '@nestjs/testing';
import { CloudsController } from './clouds.controller';
import { CloudsService } from './clouds.service';
import { JwdAuthGuard } from '../auth/guards/jwtAuth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';

const mockService = {
  createCloud: jest.fn(),
  listClouds: jest.fn(),
  getCloudById: jest.fn(),
  updateCloud: jest.fn(),
  removeCloud: jest.fn(),
};

describe('CloudsController', () => {
  let controller: CloudsController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CloudsController],
      providers: [{ provide: CloudsService, useValue: mockService }],
    })
      .overrideGuard(JwdAuthGuard).useValue({ canActivate: () => true })
      .overrideGuard(PermissionsGuard).useValue({ canActivate: () => true })
      .compile();

    controller = module.get<CloudsController>(CloudsController);
  });

  it('create — delegates to cloudsService.createCloud', async () => {
    mockService.createCloud.mockResolvedValue({ id: 'cld-1' });
    const result = await controller.create({ name: 'AWS' } as any, { user: 'user-1' });
    expect(mockService.createCloud).toHaveBeenCalledWith({ name: 'AWS' }, 'user-1');
    expect(result).toEqual({ id: 'cld-1' });
  });

  it('list — delegates to cloudsService.listClouds', async () => {
    mockService.listClouds.mockResolvedValue({ rows: [], total: 0 });
    const result = await controller.list({});
    expect(mockService.listClouds).toHaveBeenCalledWith({});
    expect(result).toEqual({ rows: [], total: 0 });
  });

  it('getById — delegates to cloudsService.getCloudById', async () => {
    mockService.getCloudById.mockResolvedValue({ id: 'cld-1' });
    const result = await controller.getById('cld-1');
    expect(mockService.getCloudById).toHaveBeenCalledWith('cld-1');
    expect(result).toEqual({ id: 'cld-1' });
  });

  it('update — delegates to cloudsService.updateCloud', async () => {
    mockService.updateCloud.mockResolvedValue({ id: 'cld-1', name: 'Azure' });
    const result = await controller.update('cld-1', { name: 'Azure' } as any, { user: 'user-1' });
    expect(mockService.updateCloud).toHaveBeenCalledWith('cld-1', { name: 'Azure' }, 'user-1');
    expect(result).toEqual({ id: 'cld-1', name: 'Azure' });
  });

  it('remove — delegates to cloudsService.removeCloud', async () => {
    mockService.removeCloud.mockResolvedValue(undefined);
    await controller.remove('cld-1');
    expect(mockService.removeCloud).toHaveBeenCalledWith('cld-1');
  });
});
