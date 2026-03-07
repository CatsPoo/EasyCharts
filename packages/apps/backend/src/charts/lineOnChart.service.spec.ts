import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { LinesOnChartService } from './lineOnChart.service';
import { LinessService } from '../lines/lines.service';

describe('LinesOnChartService', () => {
  let service: LinesOnChartService;

  const mockLinesService = {
    convertLineEntity: jest.fn((l) => ({ id: l.id })),
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
        LinesOnChartService,
        { provide: LinessService, useValue: mockLinesService },
      ],
    }).compile();

    service = module.get<LinesOnChartService>(LinesOnChartService);
  });

  // ── convertLineonChartEntity ───────────────────────────────────────────────

  describe('convertLineonChartEntity', () => {
    it('delegates line conversion to linesService', async () => {
      const entity = {
        chartId: 'chart-1',
        label: 'Link 1',
        type: 'solid',
        line: { id: 'line-1' },
      } as any;

      const result = await service.convertLineonChartEntity(entity);

      expect(mockLinesService.convertLineEntity).toHaveBeenCalledWith(entity.line);
      expect(result.chartId).toBe('chart-1');
      expect(result.label).toBe('Link 1');
      expect(result.type).toBe('solid');
    });
  });

  // ── syncLinks ──────────────────────────────────────────────────────────────

  describe('syncLinks', () => {
    it('upserts line links when items are present', async () => {
      const items = [
        { line: { id: 'line-1' }, label: 'L1', type: 'solid', chartId: 'chart-1' },
      ] as any[];

      await service.syncLinks(managerMock, 'chart-1', items);

      expect(repoMock.upsert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ chartId: 'chart-1', lineId: 'line-1', label: 'L1' }),
        ]),
        expect.objectContaining({ conflictPaths: ['chartId', 'lineId'] }),
      );
    });

    it('deletes non-kept lines by query builder when items are present', async () => {
      const items = [
        { line: { id: 'line-1' }, label: 'L1', type: 'solid', chartId: 'chart-1' },
      ] as any[];

      await service.syncLinks(managerMock, 'chart-1', items);

      expect(qbMock.execute).toHaveBeenCalled();
    });

    it('deletes all lines for chart when items array is empty', async () => {
      await service.syncLinks(managerMock, 'chart-1', []);

      expect(repoMock.delete).toHaveBeenCalledWith({ chartId: 'chart-1' });
      // service always calls upsert (with empty array) before branching on keep.length
      expect(repoMock.upsert).toHaveBeenCalledWith([], expect.any(Object));
    });

    it('does not use qb delete when items are empty', async () => {
      await service.syncLinks(managerMock, 'chart-1', []);

      expect(qbMock.execute).not.toHaveBeenCalled();
    });
  });
});
