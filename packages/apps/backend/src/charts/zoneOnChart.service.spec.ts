import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { ZonesOnChartService } from './zoneOnChart.service';
import { ZoneOnChartEntity } from './entities/zoneOnChart.entity';

const makeZoneEntity = (overrides: Partial<ZoneOnChartEntity> = {}): ZoneOnChartEntity =>
  ({
    id: 'zone-1',
    chartId: 'chart-1',
    label: 'DMZ',
    shape: 'rectangle',
    color: '#000',
    fillColor: '#eee',
    fillOpacity: 0.5,
    borderStyle: 'solid',
    borderWidth: 1,
    position: { x: 0, y: 0 },
    width: 400,
    height: 200,
    ...overrides,
  } as ZoneOnChartEntity);

describe('ZonesOnChartService', () => {
  let service: ZonesOnChartService;

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
      providers: [ZonesOnChartService],
    }).compile();

    service = module.get<ZonesOnChartService>(ZonesOnChartService);
  });

  // ── convertZoneOnChartEntity ───────────────────────────────────────────────

  describe('convertZoneOnChartEntity', () => {
    it('maps entity fields to ZoneOnChart shape', () => {
      const entity = makeZoneEntity();
      const result = service.convertZoneOnChartEntity(entity);

      expect(result.id).toBe('zone-1');
      expect(result.label).toBe('DMZ');
      expect(result.shape).toBe('rectangle');
      expect(result.color).toBe('#000');
      expect(result.fillColor).toBe('#eee');
      expect(result.fillOpacity).toBe(0.5);
      expect(result.borderStyle).toBe('solid');
      expect(result.borderWidth).toBe(1);
      expect(result.position).toEqual({ x: 0, y: 0 });
      expect(result.size).toEqual({ width: 400, height: 200 });
    });

    it('defaults fillColor to empty string when null', () => {
      const entity = makeZoneEntity({ fillColor: null as any });
      const result = service.convertZoneOnChartEntity(entity);
      expect(result.fillColor).toBe('');
    });
  });

  // ── syncZones ──────────────────────────────────────────────────────────────

  describe('syncZones', () => {
    const makeZone = () => ({
      id: 'zone-1',
      label: 'DMZ',
      shape: 'rectangle',
      color: '#000',
      fillColor: '#eee',
      fillOpacity: 0.5,
      borderStyle: 'solid',
      borderWidth: 1,
      position: { x: 0, y: 0 },
      size: { width: 400, height: 200 },
    } as any);

    it('upserts zones and deletes non-kept zones when array is non-empty', async () => {
      await service.syncZones(managerMock, 'chart-1', [makeZone()]);

      expect(repoMock.upsert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ id: 'zone-1', chartId: 'chart-1' }),
        ]),
        expect.objectContaining({ conflictPaths: ['id'] }),
      );
      expect(qbMock.execute).toHaveBeenCalled();
    });

    it('passes correct geometry fields to upsert', async () => {
      const zone = makeZone();
      await service.syncZones(managerMock, 'chart-1', [zone]);

      const upsertArg = repoMock.upsert.mock.calls[0][0][0];
      expect(upsertArg.width).toBe(400);
      expect(upsertArg.height).toBe(200);
      expect(upsertArg.borderWidth).toBe(1);
    });

    it('deletes all zones for chart when array is empty', async () => {
      await service.syncZones(managerMock, 'chart-1', []);

      expect(repoMock.delete).toHaveBeenCalledWith({ chartId: 'chart-1' });
      expect(repoMock.upsert).not.toHaveBeenCalled();
    });

    it('does not call delete-all when zones are present', async () => {
      await service.syncZones(managerMock, 'chart-1', [makeZone()]);

      expect(repoMock.delete).not.toHaveBeenCalledWith({ chartId: 'chart-1' });
    });
  });
});
