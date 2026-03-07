import { Test, TestingModule } from '@nestjs/testing';
import { ChartsInDirectoriesController } from './chartsInDirectories.controller';
import { ChartsDirectoriesService } from './chartsDirectories.service';
import { JwdAuthGuard } from '../auth/guards/jwtAuth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';

const mockService = {
  listCharts: jest.fn(),
  listChartIds: jest.fn(),
  listChartsMetadata: jest.fn(),
  addChart: jest.fn(),
  removeChart: jest.fn(),
};

describe('ChartsInDirectoriesController', () => {
  let controller: ChartsInDirectoriesController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChartsInDirectoriesController],
      providers: [{ provide: ChartsDirectoriesService, useValue: mockService }],
    })
      .overrideGuard(JwdAuthGuard).useValue({ canActivate: () => true })
      .overrideGuard(PermissionsGuard).useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ChartsInDirectoriesController>(ChartsInDirectoriesController);
  });

  it('listCharts — delegates to chartsDirsService.listCharts', async () => {
    mockService.listCharts.mockResolvedValue([]);
    const result = await controller.listCharts('dir-1');
    expect(mockService.listCharts).toHaveBeenCalledWith('dir-1');
    expect(result).toEqual([]);
  });

  it('listChartIds — delegates to chartsDirsService.listChartIds', async () => {
    mockService.listChartIds.mockResolvedValue(['c-1', 'c-2']);
    const result = await controller.listChartIds('dir-1');
    expect(mockService.listChartIds).toHaveBeenCalledWith('dir-1');
    expect(result).toEqual(['c-1', 'c-2']);
  });

  it('listChartsMetadata — delegates to chartsDirsService.listChartsMetadata', async () => {
    mockService.listChartsMetadata.mockResolvedValue([]);
    const result = await controller.listChartsMetadata('dir-1', { user: 'user-1' });
    expect(mockService.listChartsMetadata).toHaveBeenCalledWith('dir-1', 'user-1');
    expect(result).toEqual([]);
  });

  it('addChart — delegates to chartsDirsService.addChart and returns membership info', async () => {
    mockService.addChart.mockResolvedValue(undefined);
    const result = await controller.addChart('dir-1', 'chart-1', { user: 'user-1' });
    expect(mockService.addChart).toHaveBeenCalledWith('dir-1', 'chart-1', 'user-1');
    expect(result).toEqual({ directoryId: 'dir-1', chartId: 'chart-1', addedByUserId: 'user-1' });
  });

  it('removeChart — delegates to chartsDirsService.removeChart', async () => {
    mockService.removeChart.mockResolvedValue(undefined);
    await controller.removeChart('dir-1', 'chart-1');
    expect(mockService.removeChart).toHaveBeenCalledWith('dir-1', 'chart-1');
  });
});
