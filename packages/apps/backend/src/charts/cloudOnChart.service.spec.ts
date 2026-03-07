import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { CloudsOnChartService } from './cloudOnChart.service';
import { CloudOnChartEntity, CloudConnectionOnChartEntity } from './entities/cloudOnChart.entity';

describe('CloudsOnChartService', () => {
  let service: CloudsOnChartService;

  const cocQbMock = {
    delete: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    execute: jest.fn().mockResolvedValue(undefined),
  };

  const cocRepoMock = {
    upsert: jest.fn().mockResolvedValue(undefined),
    delete: jest.fn().mockResolvedValue(undefined),
    find: jest.fn().mockResolvedValue([]),
    createQueryBuilder: jest.fn(() => cocQbMock),
  };

  const connRepoMock = {
    delete: jest.fn().mockResolvedValue(undefined),
    insert: jest.fn().mockResolvedValue(undefined),
  };

  const managerMock = {
    getRepository: jest.fn((entity) => {
      if (entity === CloudOnChartEntity) return cocRepoMock;
      if (entity === CloudConnectionOnChartEntity) return connRepoMock;
      return {};
    }),
  } as unknown as EntityManager;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [CloudsOnChartService],
    }).compile();

    service = module.get<CloudsOnChartService>(CloudsOnChartService);
  });

  // ── convertCloudOnChartEntity ──────────────────────────────────────────────

  describe('convertCloudOnChartEntity', () => {
    it('maps entity fields to CloudOnChart shape', () => {
      const entity = {
        cloudId: 'cld-1',
        cloud: { id: 'cld-1', name: 'AWS' },
        position: { x: 10, y: 20 },
        width: 180,
        height: 90,
        connections: [],
      } as any;

      const result = service.convertCloudOnChartEntity(entity);

      expect(result.cloudId).toBe('cld-1');
      expect(result.position).toEqual({ x: 10, y: 20 });
      expect(result.size).toEqual({ width: 180, height: 90 });
      expect(result.connections).toEqual([]);
    });

    it('uses default size when width/height are null', () => {
      const entity = {
        cloudId: 'cld-1',
        cloud: {} as any,
        position: { x: 0, y: 0 },
        width: null,
        height: null,
        connections: [],
      } as any;

      const result = service.convertCloudOnChartEntity(entity);

      expect(result.size).toEqual({ width: 180, height: 90 });
    });

    it('maps connections correctly', () => {
      const entity = {
        cloudId: 'cld-1',
        cloud: {} as any,
        position: { x: 0, y: 0 },
        width: 200,
        height: 100,
        connections: [
          { id: 'conn-1', deviceId: 'dev-1', portId: 'port-1', cloudHandle: 'left' },
        ],
      } as any;

      const result = service.convertCloudOnChartEntity(entity);

      expect(result.connections).toHaveLength(1);
      expect(result.connections[0]).toEqual({
        id: 'conn-1',
        deviceId: 'dev-1',
        portId: 'port-1',
        cloudHandle: 'left',
      });
    });
  });

  // ── syncCloudsOnChart ──────────────────────────────────────────────────────

  describe('syncCloudsOnChart', () => {
    it('deletes all clouds for chart when array is empty', async () => {
      await service.syncCloudsOnChart(managerMock, 'chart-1', []);

      expect(cocRepoMock.delete).toHaveBeenCalledWith({ chartId: 'chart-1' });
      expect(cocRepoMock.upsert).not.toHaveBeenCalled();
    });

    it('upserts cloud placements when array is non-empty', async () => {
      const clouds = [
        { cloudId: 'cld-1', position: { x: 0, y: 0 }, size: { width: 180, height: 90 }, connections: [] },
      ] as any[];
      cocRepoMock.find.mockResolvedValue([{ id: 'coc-1', cloudId: 'cld-1' }]);

      await service.syncCloudsOnChart(managerMock, 'chart-1', clouds);

      expect(cocRepoMock.upsert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ chartId: 'chart-1', cloudId: 'cld-1' }),
        ]),
        expect.objectContaining({ conflictPaths: ['chartId', 'cloudId'] }),
      );
    });

    it('removes stale cloud placements via query builder', async () => {
      const clouds = [
        { cloudId: 'cld-1', position: { x: 0, y: 0 }, size: { width: 180, height: 90 }, connections: [] },
      ] as any[];
      cocRepoMock.find.mockResolvedValue([{ id: 'coc-1', cloudId: 'cld-1' }]);

      await service.syncCloudsOnChart(managerMock, 'chart-1', clouds);

      expect(cocQbMock.execute).toHaveBeenCalled();
    });

    it('deletes all existing connections then reinserts', async () => {
      const clouds = [
        {
          cloudId: 'cld-1',
          position: { x: 0, y: 0 },
          size: { width: 180, height: 90 },
          connections: [{ id: 'conn-1', deviceId: 'dev-1', portId: 'port-1', cloudHandle: 'left' }],
        },
      ] as any[];
      cocRepoMock.find.mockResolvedValue([{ id: 'coc-1', cloudId: 'cld-1' }]);

      await service.syncCloudsOnChart(managerMock, 'chart-1', clouds);

      expect(connRepoMock.delete).toHaveBeenCalledWith({ chartId: 'chart-1' });
      expect(connRepoMock.insert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ deviceId: 'dev-1', portId: 'port-1', cloudHandle: 'left' }),
        ]),
      );
    });

    it('does not call insert when no connections', async () => {
      const clouds = [
        { cloudId: 'cld-1', position: { x: 0, y: 0 }, size: { width: 180, height: 90 }, connections: [] },
      ] as any[];
      cocRepoMock.find.mockResolvedValue([{ id: 'coc-1', cloudId: 'cld-1' }]);

      await service.syncCloudsOnChart(managerMock, 'chart-1', clouds);

      expect(connRepoMock.insert).not.toHaveBeenCalled();
    });
  });
});
