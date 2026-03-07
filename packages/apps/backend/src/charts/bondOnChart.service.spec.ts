import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { BondsOnChartService } from './bondOnChart.service';
import { LinessService } from '../lines/lines.service';

describe('BondsOnChartService', () => {
  let service: BondsOnChartService;

  const mockLinesService = {
    convertBondEntitytoBond: jest.fn((b) => ({ id: b.id, name: b.name, membersLines: [] })),
  };

  const qbMock = {
    delete: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    execute: jest.fn().mockResolvedValue(undefined),
  };

  const repoMock = {
    upsert: jest.fn().mockResolvedValue(undefined),
    delete: jest.fn().mockResolvedValue(undefined),
    createQueryBuilder: jest.fn(() => qbMock),
  };

  const managerMock = {
    getRepository: jest.fn(() => repoMock),
  } as unknown as EntityManager;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BondsOnChartService,
        { provide: LinessService, useValue: mockLinesService },
      ],
    }).compile();

    service = module.get<BondsOnChartService>(BondsOnChartService);
  });

  // ── convertBondOnChartEntity ───────────────────────────────────────────────

  describe('convertBondOnChartEntity', () => {
    it('delegates bond conversion to linesService', () => {
      const entity = {
        chartId: 'chart-1',
        bondId: 'bond-1',
        position: { x: 10, y: 20 },
        bond: { id: 'bond-1', name: 'Bond A', members: [] },
      } as any;

      const result = service.convertBondOnChartEntity(entity);

      expect(mockLinesService.convertBondEntitytoBond).toHaveBeenCalledWith(entity.bond);
      expect(result.chartId).toBe('chart-1');
      expect(result.position).toEqual({ x: 10, y: 20 });
    });
  });

  // ── syncLinks ──────────────────────────────────────────────────────────────

  describe('syncLinks', () => {
    it('upserts bond links when items are present', async () => {
      const items = [
        { bond: { id: 'bond-1' }, position: { x: 0, y: 0 } },
      ] as any[];

      await service.syncLinks(managerMock, 'chart-1', items);

      expect(repoMock.upsert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ chartId: 'chart-1', bondId: 'bond-1' }),
        ]),
        expect.objectContaining({ conflictPaths: ['chartId', 'bondId'] }),
      );
    });

    it('deletes non-kept bonds when items are present', async () => {
      const items = [
        { bond: { id: 'bond-1' }, position: { x: 0, y: 0 } },
      ] as any[];

      await service.syncLinks(managerMock, 'chart-1', items);

      expect(qbMock.execute).toHaveBeenCalled();
    });

    it('preserves position in upsert row', async () => {
      const items = [
        { bond: { id: 'bond-2' }, position: { x: 5, y: 15 } },
      ] as any[];

      await service.syncLinks(managerMock, 'chart-1', items);

      const upsertArg = repoMock.upsert.mock.calls[0][0][0];
      expect(upsertArg.position).toEqual({ x: 5, y: 15 });
    });

    it('deletes all bonds for chart when items array is empty', async () => {
      await service.syncLinks(managerMock, 'chart-1', []);

      expect(repoMock.delete).toHaveBeenCalledWith({ chartId: 'chart-1' });
      expect(repoMock.upsert).not.toHaveBeenCalled();
    });
  });
});
