import { Test, TestingModule } from '@nestjs/testing';
import { ModelsController } from './models.controller';
import { ModelsService } from './model.service';
import { JwdAuthGuard } from '../auth/guards/jwtAuth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';

const mockService = {
  createModel: jest.fn(),
  listModels: jest.fn(),
  getModelById: jest.fn(),
  updateModel: jest.fn(),
  removeModel: jest.fn(),
};

describe('ModelsController', () => {
  let controller: ModelsController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ModelsController],
      providers: [{ provide: ModelsService, useValue: mockService }],
    })
      .overrideGuard(JwdAuthGuard).useValue({ canActivate: () => true })
      .overrideGuard(PermissionsGuard).useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ModelsController>(ModelsController);
  });

  it('create — delegates to modelsService.createModel', async () => {
    mockService.createModel.mockResolvedValue({ id: 'm-1' });
    const result = await controller.create({ name: 'Catalyst 9000' } as any, { user: 'user-1' });
    expect(mockService.createModel).toHaveBeenCalledWith({ name: 'Catalyst 9000' }, 'user-1');
    expect(result).toEqual({ id: 'm-1' });
  });

  it('list — delegates to modelsService.listModels', async () => {
    mockService.listModels.mockResolvedValue({ rows: [], total: 0 });
    const result = await controller.list({} as any);
    expect(mockService.listModels).toHaveBeenCalledWith({});
    expect(result).toEqual({ rows: [], total: 0 });
  });

  it('getById — delegates to modelsService.getModelById', async () => {
    mockService.getModelById.mockResolvedValue({ id: 'm-1' });
    const result = await controller.getById('m-1');
    expect(mockService.getModelById).toHaveBeenCalledWith('m-1');
    expect(result).toEqual({ id: 'm-1' });
  });

  it('update — delegates to modelsService.updateModel', async () => {
    mockService.updateModel.mockResolvedValue({ id: 'm-1', name: 'Nexus 9000' });
    const result = await controller.update('m-1', { name: 'Nexus 9000' } as any, { user: 'user-1' });
    expect(mockService.updateModel).toHaveBeenCalledWith('m-1', { name: 'Nexus 9000' }, 'user-1');
    expect(result).toEqual({ id: 'm-1', name: 'Nexus 9000' });
  });

  it('remove — delegates to modelsService.removeModel', async () => {
    mockService.removeModel.mockResolvedValue(undefined);
    await controller.remove('m-1');
    expect(mockService.removeModel).toHaveBeenCalledWith('m-1');
  });
});
