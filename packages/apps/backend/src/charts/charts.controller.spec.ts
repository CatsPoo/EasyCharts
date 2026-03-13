import { Test, TestingModule } from '@nestjs/testing';
import { ChartsController } from './charts.controller';
import { ChartsService } from './charts.service';
import { JwdAuthGuard } from '../auth/guards/jwtAuth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { ChartShareGuard } from './guards/chartShare.guard';

const mockService = {
  getAllCharts: jest.fn(),
  getAllUserChartsMetadata: jest.fn(),
  getUnassignedChartsMetadata: jest.fn(),
  getChartMetadataById: jest.fn(),
  fetchLock: jest.fn(),
  lockChart: jest.fn(),
  unlockChart: jest.fn(),
  getChartById: jest.fn(),
  createChart: jest.fn(),
  removeChart: jest.fn(),
  updateChart: jest.fn(),
  getChartShares: jest.fn(),
  shareChart: jest.fn(),
  unshareChart: jest.fn(),
};

describe('ChartsController', () => {
  let controller: ChartsController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChartsController],
      providers: [{ provide: ChartsService, useValue: mockService }],
    })
      .overrideGuard(JwdAuthGuard).useValue({ canActivate: () => true })
      .overrideGuard(PermissionsGuard).useValue({ canActivate: () => true })
      .overrideGuard(ChartShareGuard).useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ChartsController>(ChartsController);
  });

  it('findAll — delegates to chartService.getAllCharts', async () => {
    mockService.getAllCharts.mockResolvedValue([]);
    const result = await controller.findAll();
    expect(mockService.getAllCharts).toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  it('getAllChartMetadata — delegates to chartService.getAllUserChartsMetadata', async () => {
    mockService.getAllUserChartsMetadata.mockResolvedValue([]);
    const result = await controller.getAllChartMetadata({ user: 'user-1' });
    expect(mockService.getAllUserChartsMetadata).toHaveBeenCalledWith('user-1');
    expect(result).toEqual([]);
  });

  it('getUnassignedChartMetadata — delegates to chartService.getUnassignedChartsMetadata', async () => {
    mockService.getUnassignedChartsMetadata.mockResolvedValue([]);
    const result = await controller.getUnassignedChartMetadata({ user: 'user-1' });
    expect(mockService.getUnassignedChartsMetadata).toHaveBeenCalledWith('user-1');
    expect(result).toEqual([]);
  });

  it('getChartMetadata — delegates to chartService.getChartMetadataById', async () => {
    mockService.getChartMetadataById.mockResolvedValue({ id: 'c-1' });
    const result = await controller.getChartMetadata('c-1', { user: 'user-1' });
    expect(mockService.getChartMetadataById).toHaveBeenCalledWith('c-1', 'user-1');
    expect(result).toEqual({ id: 'c-1' });
  });

  it('fetchLock — delegates to chartService.fetchLock', async () => {
    mockService.fetchLock.mockResolvedValue({ lockState: 'UNLOCKED' });
    const result = await controller.fetchLock('c-1', { user: 'user-1' });
    expect(mockService.fetchLock).toHaveBeenCalledWith('c-1', 'user-1');
    expect(result).toEqual({ lockState: 'UNLOCKED' });
  });

  it('lockChart — delegates to chartService.lockChart', async () => {
    mockService.lockChart.mockResolvedValue({ lockState: 'MINE' });
    const result = await controller.lockChart('c-1', { user: 'user-1' });
    expect(mockService.lockChart).toHaveBeenCalledWith('c-1', 'user-1');
    expect(result).toEqual({ lockState: 'MINE' });
  });

  it('unlockChart — delegates to chartService.unlockChart', async () => {
    mockService.unlockChart.mockResolvedValue({ lockState: 'UNLOCKED' });
    const result = await controller.unlockChart('c-1', { user: 'user-1' });
    expect(mockService.unlockChart).toHaveBeenCalledWith('c-1', 'user-1');
    expect(result).toEqual({ lockState: 'UNLOCKED' });
  });

  it('findOne — delegates to chartService.getChartById', async () => {
    mockService.getChartById.mockResolvedValue({ id: 'c-1' });
    const result = await controller.findOne('c-1');
    expect(mockService.getChartById).toHaveBeenCalledWith('c-1');
    expect(result).toEqual({ id: 'c-1' });
  });

  it('create — delegates to chartService.createChart', async () => {
    mockService.createChart.mockResolvedValue({ id: 'c-1' });
    const result = await controller.create({ name: 'My Chart' } as any, { user: 'user-1' });
    expect(mockService.createChart).toHaveBeenCalledWith({ name: 'My Chart' }, 'user-1');
    expect(result).toEqual({ id: 'c-1' });
  });

  it('remove — delegates to chartService.removeChart', async () => {
    mockService.removeChart.mockResolvedValue(undefined);
    await controller.remove('c-1', { user: 'user-1' });
    expect(mockService.removeChart).toHaveBeenCalledWith('c-1', 'user-1');
  });

  it('updateChart — delegates to chartService.updateChart', async () => {
    mockService.updateChart.mockResolvedValue({ id: 'c-1' });
    const result = await controller.updateChart('c-1', { name: 'Updated' } as any, { user: 'user-1' });
    expect(mockService.updateChart).toHaveBeenCalledWith('c-1', { name: 'Updated' }, 'user-1');
    expect(result).toEqual({ id: 'c-1' });
  });

  it('getShares — delegates to chartService.getChartShares', async () => {
    mockService.getChartShares.mockResolvedValue([]);
    const result = await controller.getShares('c-1');
    expect(mockService.getChartShares).toHaveBeenCalledWith('c-1');
    expect(result).toEqual([]);
  });

  it('share — delegates to chartService.shareChart with privileges', async () => {
    mockService.shareChart.mockResolvedValue({ id: 's-1' });
    const body = { sharedWithUserId: 'user-2', canEdit: true, canDelete: false, canShare: false };
    const result = await controller.share('c-1', body as any, { user: 'user-1' });
    expect(mockService.shareChart).toHaveBeenCalledWith(
      'c-1', 'user-2', 'user-1',
      { canEdit: true, canDelete: false, canShare: false },
    );
    expect(result).toEqual({ id: 's-1' });
  });

  it('unshare — delegates to chartService.unshareChart', async () => {
    mockService.unshareChart.mockResolvedValue(undefined);
    await controller.unshare('c-1', 'user-2');
    expect(mockService.unshareChart).toHaveBeenCalledWith('c-1', 'user-2');
  });
});
