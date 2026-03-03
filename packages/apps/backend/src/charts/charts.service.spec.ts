import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ChartInDirectoryEntity } from '../chartsDirectories/entities/chartsInDirectory.entity';
import { DirectoryShareEntity } from '../chartsDirectories/entities/directoryShare.entity';
import { PortsService } from '../devices/ports.service';
import { LinessService } from '../lines/lines.service';
import { BondsOnChartService } from './bondOnChart.service';
import { ChartVersionsService } from './chartVersions.service';
import { ChartsService } from './charts.service';
import { CloudsOnChartService } from './cloudOnChart.service';
import { DevicesOnChartService } from './deviceOnChart.service';
import { ChartEntity } from './entities/chart.entity';
import { ChartShareEntity } from './entities/chartShare.entity';
import { ChartIsLockedExeption } from './exeptions/chartIsLocked.exeption';
import { ChartNotFoundExeption } from './exeptions/chartNotFound.exeption';
import { LinesOnChartService } from './lineOnChart.service';
import { NotesOnChartService } from './noteOnChart.service';
import { PortsOnChartService } from './portsOnChart.service';
import { ZonesOnChartService } from './zoneOnChart.service';

const baseChart = (overrides: Partial<ChartEntity> = {}): ChartEntity =>
  ({
    id: 'chart-1',
    name: 'Test Chart',
    description: '',
    createdByUserId: 'user-1',
    lockedById: null,
    lockedAt: null,
    lockedBy: null,
    devicesOnChart: [],
    linesOnChart: [],
    bondOnChart: [],
    notesOnChart: [],
    zonesOnChart: [],
    cloudsOnChart: [],
    ...overrides,
  } as any);

const makeRepoMock = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  findOneOrFail: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  create: jest.fn(),
  delete: jest.fn(),
  upsert: jest.fn(),
  createQueryBuilder: jest.fn().mockReturnValue({
    leftJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    into: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    orIgnore: jest.fn().mockReturnThis(),
    execute: jest.fn().mockResolvedValue({}),
    getMany: jest.fn().mockResolvedValue([]),
  }),
});

describe('ChartsService', () => {
  let service: ChartsService;
  let chartRepo: ReturnType<typeof makeRepoMock>;
  let chartShareRepo: ReturnType<typeof makeRepoMock>;
  let cidRepo: ReturnType<typeof makeRepoMock>;

  beforeEach(async () => {
    jest.clearAllMocks();

    const chartRepoMock = makeRepoMock();
    const chartShareRepoMock = makeRepoMock();
    const cidRepoMock = makeRepoMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChartsService,
        { provide: DataSource, useValue: { transaction: jest.fn() } },
        { provide: getRepositoryToken(ChartEntity), useValue: chartRepoMock },
        { provide: getRepositoryToken(ChartShareEntity), useValue: chartShareRepoMock },
        { provide: getRepositoryToken(ChartInDirectoryEntity), useValue: cidRepoMock },
        { provide: getRepositoryToken(DirectoryShareEntity), useValue: makeRepoMock() },
        {
          provide: LinessService,
          useValue: {
            getConnectedPortIdMap: jest.fn().mockResolvedValue(new Map()),
            upsertLines: jest.fn(),
            ensureAndUpdateBonds: jest.fn(),
            deleteOrphanLines: jest.fn(),
          },
        },
        { provide: PortsService, useValue: { recomputePortsInUse: jest.fn() } },
        {
          provide: DevicesOnChartService,
          useValue: {
            convertDeviceOnChartEntity: jest.fn(),
            syncPlacementsAndHandles: jest.fn(),
          },
        },
        {
          provide: LinesOnChartService,
          useValue: {
            convertLineonChartEntity: jest.fn(),
            syncLinks: jest.fn(),
          },
        },
        {
          provide: BondsOnChartService,
          useValue: {
            convertBondOnChartEntity: jest.fn(),
            syncLinks: jest.fn(),
          },
        },
        {
          provide: NotesOnChartService,
          useValue: {
            convertNoteOnChartEntity: jest.fn(),
            syncNotes: jest.fn(),
          },
        },
        {
          provide: ZonesOnChartService,
          useValue: {
            convertZoneOnChartEntity: jest.fn(),
            syncZones: jest.fn(),
          },
        },
        {
          provide: CloudsOnChartService,
          useValue: {
            convertCloudOnChartEntity: jest.fn(),
            syncCloudsOnChart: jest.fn(),
          },
        },
        { provide: PortsOnChartService, useValue: {} },
        { provide: ChartVersionsService, useValue: { saveVersion: jest.fn() } },
      ],
    }).compile();

    service = module.get<ChartsService>(ChartsService);
    chartRepo = module.get(getRepositoryToken(ChartEntity));
    chartShareRepo = module.get(getRepositoryToken(ChartShareEntity));
    cidRepo = module.get(getRepositoryToken(ChartInDirectoryEntity));
  });

  // ── getLockFromChartEntity ──────────────────────────────────────────────────

  describe('getLockFromChartEntity', () => {
    it('returns lock info when chart is locked', () => {
      const chart = baseChart({
        lockedById: 'user-2',
        lockedAt: new Date('2025-01-01'),
        lockedBy: { username: 'otheruser' } as any,
      });
      const lock = service.getLockFromChartEntity(chart);
      expect(lock.chartId).toBe('chart-1');
      expect(lock.lockedById).toBe('user-2');
      expect(lock.lockedByName).toBe('otheruser');
    });

    it('returns null fields when chart is not locked', () => {
      const chart = baseChart();
      const lock = service.getLockFromChartEntity(chart);
      expect(lock.lockedById).toBeNull();
      expect(lock.lockedAt).toBeNull();
      expect(lock.lockedByName).toBe('');
    });
  });

  // ── lockChart ───────────────────────────────────────────────────────────────

  describe('lockChart', () => {
    it('locks an unlocked chart and saves', async () => {
      const chart = baseChart();
      chartRepo.findOne.mockResolvedValue(chart);
      chartRepo.save.mockResolvedValue({ ...chart, lockedById: 'user-1', lockedAt: new Date() });

      await service.lockChart('chart-1', 'user-1');
      expect(chartRepo.save).toHaveBeenCalled();
    });

    it('does not re-lock when already locked by the same user', async () => {
      const chart = baseChart({ lockedById: 'user-1', lockedAt: new Date() });
      chartRepo.findOne.mockResolvedValue(chart);

      await service.lockChart('chart-1', 'user-1');
      expect(chartRepo.save).not.toHaveBeenCalled();
    });

    it('throws ChartIsLockedExeption when locked by another user', async () => {
      const chart = baseChart({ lockedById: 'user-2', lockedAt: new Date() });
      chartRepo.findOne.mockResolvedValue(chart);

      await expect(service.lockChart('chart-1', 'user-1')).rejects.toThrow(
        ChartIsLockedExeption,
      );
    });

    it('throws ChartNotFoundExeption when chart does not exist', async () => {
      chartRepo.findOne.mockResolvedValue(null);
      await expect(service.lockChart('nonexistent', 'user-1')).rejects.toThrow(
        ChartNotFoundExeption,
      );
    });
  });

  // ── unlockChart ─────────────────────────────────────────────────────────────

  describe('unlockChart', () => {
    it('unlocks a chart locked by the requesting user', async () => {
      const lockedChart = baseChart({ lockedById: 'user-1', lockedAt: new Date() });
      const unlockedChart = baseChart({ lockedById: null, lockedAt: null, lockedBy: null });

      chartRepo.findOne
        .mockResolvedValueOnce(lockedChart)
        .mockResolvedValueOnce(unlockedChart);
      chartRepo.update.mockResolvedValue({ affected: 1 });

      const result = await service.unlockChart('chart-1', 'user-1');
      expect(chartRepo.update).toHaveBeenCalledWith('chart-1', {
        lockedById: null,
        lockedAt: null,
      });
      expect(result.lockedById).toBeNull();
    });

    it('returns immediately without updating when chart is already unlocked', async () => {
      chartRepo.findOne.mockResolvedValue(baseChart());

      await service.unlockChart('chart-1', 'user-1');
      expect(chartRepo.update).not.toHaveBeenCalled();
    });

    it('throws ChartIsLockedExeption when chart is locked by another user', async () => {
      const chart = baseChart({ lockedById: 'user-2', lockedAt: new Date() });
      chartRepo.findOne.mockResolvedValue(chart);

      await expect(service.unlockChart('chart-1', 'user-1')).rejects.toThrow(
        ChartIsLockedExeption,
      );
    });

    it('throws ChartNotFoundExeption when chart does not exist', async () => {
      chartRepo.findOne.mockResolvedValue(null);
      await expect(service.unlockChart('nonexistent', 'user-1')).rejects.toThrow(
        ChartNotFoundExeption,
      );
    });
  });

  // ── fetchLock ───────────────────────────────────────────────────────────────

  describe('fetchLock', () => {
    it('returns lock info for an existing chart', async () => {
      const chart = baseChart({ lockedById: 'user-2', lockedAt: new Date() });
      chartRepo.findOne.mockResolvedValue(chart);

      const lock = await service.fetchLock('chart-1', 'user-1');
      expect(lock.chartId).toBe('chart-1');
      expect(lock.lockedById).toBe('user-2');
    });

    it('throws ChartNotFoundExeption when chart does not exist', async () => {
      chartRepo.findOne.mockResolvedValue(null);
      await expect(service.fetchLock('nonexistent', 'user-1')).rejects.toThrow(
        ChartNotFoundExeption,
      );
    });
  });

  // ── removeChart ─────────────────────────────────────────────────────────────

  describe('removeChart', () => {
    it('removes chart when owner requests deletion', async () => {
      const chart = baseChart();
      chartRepo.findOne.mockResolvedValue(chart);
      chartRepo.remove.mockResolvedValue(chart);

      await service.removeChart('chart-1', 'user-1');
      expect(chartRepo.remove).toHaveBeenCalledWith(chart);
    });

    it('removes chart when non-owner has delete permission', async () => {
      const chart = baseChart({ createdByUserId: 'user-2' });
      chartRepo.findOne.mockResolvedValue(chart);
      chartShareRepo.findOne.mockResolvedValue({ canDelete: true } as any);
      chartRepo.remove.mockResolvedValue(chart);

      await service.removeChart('chart-1', 'user-1');
      expect(chartRepo.remove).toHaveBeenCalled();
    });

    it('throws ForbiddenException when non-owner lacks delete permission', async () => {
      const chart = baseChart({ createdByUserId: 'user-2' });
      chartRepo.findOne.mockResolvedValue(chart);
      chartShareRepo.findOne.mockResolvedValue(null);

      await expect(service.removeChart('chart-1', 'user-1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws ChartIsLockedExeption when chart is locked by another user', async () => {
      const chart = baseChart({ lockedById: 'user-2', lockedAt: new Date() });
      chartRepo.findOne.mockResolvedValue(chart);

      await expect(service.removeChart('chart-1', 'user-1')).rejects.toThrow(
        ChartIsLockedExeption,
      );
    });

    it('throws ChartNotFoundExeption when chart does not exist', async () => {
      chartRepo.findOne.mockResolvedValue(null);
      await expect(service.removeChart('nonexistent', 'user-1')).rejects.toThrow(
        ChartNotFoundExeption,
      );
    });
  });

  // ── computePrivileges (private, tested via behaviour) ─────────────────────

  describe('computePrivileges', () => {
    it('grants all privileges to chart owner', () => {
      const chart = baseChart({ createdByUserId: 'user-1' });
      const result = (service as any).computePrivileges(chart, 'user-1', new Map());
      expect(result).toEqual({ canEdit: true, canDelete: true, canShare: true });
    });

    it('grants privileges from share record for non-owner', () => {
      const chart = baseChart({ createdByUserId: 'user-2' });
      const shareMap = new Map([
        ['chart-1', { canEdit: true, canDelete: false, canShare: false }],
      ]);
      const result = (service as any).computePrivileges(chart, 'user-1', shareMap);
      expect(result).toEqual({ canEdit: true, canDelete: false, canShare: false });
    });

    it('grants no privileges when not owner and no share exists', () => {
      const chart = baseChart({ createdByUserId: 'user-2' });
      const result = (service as any).computePrivileges(chart, 'user-1', new Map());
      expect(result).toEqual({ canEdit: false, canDelete: false, canShare: false });
    });
  });

  // ── unshareChart ────────────────────────────────────────────────────────────

  describe('unshareChart', () => {
    it('deletes the share record', async () => {
      chartShareRepo.delete = jest.fn().mockResolvedValue({ affected: 1 });
      await service.unshareChart('chart-1', 'user-2');
      expect(chartShareRepo.delete).toHaveBeenCalledWith({
        chartId: 'chart-1',
        sharedWithUserId: 'user-2',
      });
    });
  });

  // ── shareChart ──────────────────────────────────────────────────────────────

  describe('shareChart', () => {
    it('throws NotFoundException when chart does not exist', async () => {
      chartRepo.findOne.mockResolvedValue(null);
      await expect(
        service.shareChart('chart-1', 'user-2', 'user-1', {
          canEdit: false,
          canDelete: false,
          canShare: false,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when trying to share with the chart creator', async () => {
      chartRepo.findOne.mockResolvedValue(
        baseChart({ createdByUserId: 'user-2' }),
      );
      await expect(
        service.shareChart('chart-1', 'user-2', 'user-1', {
          canEdit: false,
          canDelete: false,
          canShare: false,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('upserts share record when owner shares chart', async () => {
      chartRepo.findOne.mockResolvedValue(baseChart({ createdByUserId: 'user-1' }));
      chartShareRepo.upsert = jest.fn().mockResolvedValue({});
      cidRepo.find.mockResolvedValue([]);

      await service.shareChart('chart-1', 'user-2', 'user-1', {
        canEdit: true,
        canDelete: false,
        canShare: false,
      });
      expect(chartShareRepo.upsert).toHaveBeenCalled();
    });
  });
});
