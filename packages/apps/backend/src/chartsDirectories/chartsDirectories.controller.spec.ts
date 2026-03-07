import { Test, TestingModule } from '@nestjs/testing';
import { ChartsDirectoriesController } from './chartsDirectories.controller';
import { ChartsDirectoriesService } from './chartsDirectories.service';
import { JwdAuthGuard } from '../auth/guards/jwtAuth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';

const mockService = {
  createChartsDirectory: jest.fn(),
  listRoots: jest.fn(),
  getChartsDirectoryById: jest.fn(),
  listChildren: jest.fn(),
  updateChartsDirectory: jest.fn(),
  remove: jest.fn(),
  getDirectoryShares: jest.fn(),
  shareDirectory: jest.fn(),
  unshareDirectory: jest.fn(),
  unshareDirectoryContent: jest.fn(),
};

describe('ChartsDirectoriesController', () => {
  let controller: ChartsDirectoriesController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChartsDirectoriesController],
      providers: [{ provide: ChartsDirectoriesService, useValue: mockService }],
    })
      .overrideGuard(JwdAuthGuard).useValue({ canActivate: () => true })
      .overrideGuard(PermissionsGuard).useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ChartsDirectoriesController>(ChartsDirectoriesController);
  });

  it('create — delegates to chartsDirectoriesService.createChartsDirectory', async () => {
    mockService.createChartsDirectory.mockResolvedValue({ id: 'dir-1' });
    const result = await controller.create({ name: 'Root' } as any, { user: 'user-1' });
    expect(mockService.createChartsDirectory).toHaveBeenCalledWith({ name: 'Root' }, 'user-1');
    expect(result).toEqual({ id: 'dir-1' });
  });

  it('listRootsDirectories — delegates to chartsDirectoriesService.listRoots', async () => {
    mockService.listRoots.mockResolvedValue([]);
    const result = await controller.listRootsDirectories({ user: 'user-1' });
    expect(mockService.listRoots).toHaveBeenCalledWith('user-1');
    expect(result).toEqual([]);
  });

  it('getById — delegates to chartsDirectoriesService.getChartsDirectoryById', async () => {
    mockService.getChartsDirectoryById.mockResolvedValue({ id: 'dir-1' });
    const result = await controller.getById('dir-1');
    expect(mockService.getChartsDirectoryById).toHaveBeenCalledWith('dir-1');
    expect(result).toEqual({ id: 'dir-1' });
  });

  it('listChildren — delegates to chartsDirectoriesService.listChildren', async () => {
    mockService.listChildren.mockResolvedValue([]);
    const result = await controller.listChildren('dir-1', { user: 'user-1' });
    expect(mockService.listChildren).toHaveBeenCalledWith('dir-1', 'user-1');
    expect(result).toEqual([]);
  });

  it('update — delegates to chartsDirectoriesService.updateChartsDirectory', async () => {
    mockService.updateChartsDirectory.mockResolvedValue({ id: 'dir-1', name: 'Updated' });
    const result = await controller.update('dir-1', { name: 'Updated' } as any, { user: 'user-1' });
    expect(mockService.updateChartsDirectory).toHaveBeenCalledWith('dir-1', { name: 'Updated' }, 'user-1');
    expect(result).toEqual({ id: 'dir-1', name: 'Updated' });
  });

  it('remove — delegates to chartsDirectoriesService.remove', async () => {
    mockService.remove.mockResolvedValue(undefined);
    await controller.remove('dir-1', { user: 'user-1' });
    expect(mockService.remove).toHaveBeenCalledWith('dir-1', 'user-1');
  });

  it('getShares — delegates to chartsDirectoriesService.getDirectoryShares', async () => {
    mockService.getDirectoryShares.mockResolvedValue([]);
    const result = await controller.getShares('dir-1');
    expect(mockService.getDirectoryShares).toHaveBeenCalledWith('dir-1');
    expect(result).toEqual([]);
  });

  it('share — delegates to chartsDirectoriesService.shareDirectory with privileges', async () => {
    mockService.shareDirectory.mockResolvedValue({ id: 's-1' });
    const body = { sharedWithUserId: 'user-2', canEdit: true, canDelete: false, canShare: false, includeContent: true };
    const result = await controller.share('dir-1', body as any, { user: 'user-1' });
    expect(mockService.shareDirectory).toHaveBeenCalledWith(
      'dir-1', 'user-2', 'user-1',
      { canEdit: true, canDelete: false, canShare: false },
      true,
    );
    expect(result).toEqual({ id: 's-1' });
  });

  it('unshare — delegates to chartsDirectoriesService.unshareDirectory', async () => {
    mockService.unshareDirectory.mockResolvedValue(undefined);
    await controller.unshare('dir-1', 'user-2');
    expect(mockService.unshareDirectory).toHaveBeenCalledWith('dir-1', 'user-2');
  });

  it('unshareContent — delegates to chartsDirectoriesService.unshareDirectoryContent', async () => {
    mockService.unshareDirectoryContent.mockResolvedValue(undefined);
    await controller.unshareContent('dir-1', 'user-2');
    expect(mockService.unshareDirectoryContent).toHaveBeenCalledWith('dir-1', 'user-2');
  });
});
