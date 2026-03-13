import { Test, TestingModule } from '@nestjs/testing';
import { ChartVersionsController } from './chartVersions.controller';
import { ChartVersionsService } from './chartVersions.service';
import { ChartsService } from './charts.service';
import { JwdAuthGuard } from '../auth/guards/jwtAuth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { ChartShareGuard } from './guards/chartShare.guard';

const mockChartVersionsService = {
  listVersions: jest.fn(),
  getVersion: jest.fn(),
};

const mockChartsService = {
  updateChart: jest.fn(),
};

describe('ChartVersionsController', () => {
  let controller: ChartVersionsController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChartVersionsController],
      providers: [
        { provide: ChartVersionsService, useValue: mockChartVersionsService },
        { provide: ChartsService, useValue: mockChartsService },
      ],
    })
      .overrideGuard(JwdAuthGuard).useValue({ canActivate: () => true })
      .overrideGuard(PermissionsGuard).useValue({ canActivate: () => true })
      .overrideGuard(ChartShareGuard).useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ChartVersionsController>(ChartVersionsController);
  });

  // ── listVersions ───────────────────────────────────────────────────────────

  it('listVersions — delegates to chartVersionsService.listVersions', async () => {
    mockChartVersionsService.listVersions.mockResolvedValue([{ versionNumber: 1 }]);
    const result = await controller.listVersions('chart-1');
    expect(mockChartVersionsService.listVersions).toHaveBeenCalledWith('chart-1');
    expect(result).toEqual([{ versionNumber: 1 }]);
  });

  // ── getVersion ─────────────────────────────────────────────────────────────

  it('getVersion — delegates to chartVersionsService.getVersion', async () => {
    mockChartVersionsService.getVersion.mockResolvedValue({ versionNumber: 1, snapshot: {} });
    const result = await controller.getVersion('chart-1', 'ver-1');
    expect(mockChartVersionsService.getVersion).toHaveBeenCalledWith('chart-1', 'ver-1');
    expect(result).toEqual({ versionNumber: 1, snapshot: {} });
  });

  // ── rollback ───────────────────────────────────────────────────────────────

  describe('rollback', () => {
    it('calls chartsService.updateChart with snapshot fields including defaults for missing arrays', async () => {
      const snap = {
        name: 'My Chart',
        description: 'desc',
        devicesOnChart: [{ device: { id: 'dev-1' } }],
        linesOnChart: [],
        // bondsOnChart, notesOnChart, zonesOnChart, cloudsOnChart intentionally missing
      };
      mockChartVersionsService.getVersion.mockResolvedValue({ versionNumber: 3, snapshot: snap });
      mockChartsService.updateChart.mockResolvedValue({ id: 'chart-1' });

      const result = await controller.rollback('chart-1', 'ver-3', { user: 'user-1' });

      expect(mockChartsService.updateChart).toHaveBeenCalledWith(
        'chart-1',
        {
          name: 'My Chart',
          description: 'desc',
          devicesOnChart: snap.devicesOnChart,
          linesOnChart: [],
          bondsOnChart: [],
          notesOnChart: [],
          zonesOnChart: [],
          cloudsOnChart: [],
          versionLabel: 'Rollback to v3',
        },
        'user-1',
      );
      expect(result).toEqual({ id: 'chart-1' });
    });

    it('uses empty arrays for all chart content fields when snapshot has none', async () => {
      const snap = { name: 'Empty', description: '' };
      mockChartVersionsService.getVersion.mockResolvedValue({ versionNumber: 1, snapshot: snap });
      mockChartsService.updateChart.mockResolvedValue({ id: 'chart-1' });

      await controller.rollback('chart-1', 'ver-1', { user: 'user-1' });

      const callArg = mockChartsService.updateChart.mock.calls[0][1];
      expect(callArg.devicesOnChart).toEqual([]);
      expect(callArg.linesOnChart).toEqual([]);
      expect(callArg.bondsOnChart).toEqual([]);
      expect(callArg.notesOnChart).toEqual([]);
      expect(callArg.zonesOnChart).toEqual([]);
      expect(callArg.cloudsOnChart).toEqual([]);
    });
  });
});
