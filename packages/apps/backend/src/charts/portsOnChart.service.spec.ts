import { Test, TestingModule } from '@nestjs/testing';
import { PortsService } from '../devices/ports.service';
import { PortsOnChartService } from './portsOnChart.service';

describe('PortsOnChartService', () => {
  let service: PortsOnChartService;

  const mockPortsService = {
    convertPortEntityToPort: jest.fn((p) => p),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PortsOnChartService,
        { provide: PortsService, useValue: mockPortsService },
      ],
    }).compile();

    service = module.get<PortsOnChartService>(PortsOnChartService);
  });

  // ── handlesToRows ──────────────────────────────────────────────────────────

  describe('handlesToRows', () => {
    it('returns empty array when handles is undefined', () => {
      const result = service.handlesToRows('chart-1', 'dev-1', undefined);
      expect(result).toEqual([]);
    });

    it('returns empty array when all sides are empty', () => {
      const handles = { left: [], right: [], top: [], bottom: [] } as any;
      const result = service.handlesToRows('chart-1', 'dev-1', handles);
      expect(result).toEqual([]);
    });

    it('maps a single handle to a row with correct shape', () => {
      const handles = {
        left: [{ port: { id: 'port-1' } }],
        right: [],
        top: [],
        bottom: [],
      } as any;

      const rows = service.handlesToRows('chart-1', 'dev-1', handles);

      expect(rows).toHaveLength(1);
      expect(rows[0]).toEqual({ chartId: 'chart-1', deviceId: 'dev-1', portId: 'port-1', side: 'left' });
    });

    it('maps handles from multiple sides', () => {
      const handles = {
        left: [{ port: { id: 'p1' } }],
        right: [{ port: { id: 'p2' } }],
        top: [],
        bottom: [{ port: { id: 'p3' } }],
      } as any;

      const rows = service.handlesToRows('chart-1', 'dev-1', handles);

      expect(rows).toHaveLength(3);
      const sides = rows.map((r) => r.side);
      expect(sides).toContain('left');
      expect(sides).toContain('right');
      expect(sides).toContain('bottom');
    });
  });

  // ── rowsToHandles ──────────────────────────────────────────────────────────

  describe('rowsToHandles', () => {
    it('returns empty handles when no placements', () => {
      const result = service.rowsToHandles([]);
      expect(result).toEqual({ left: [], right: [], top: [], bottom: [] });
    });

    it('groups placements into correct side buckets', () => {
      const placements = [
        { side: 'left', port: { id: 'p1', name: 'eth0' } },
        { side: 'right', port: { id: 'p2', name: 'eth1' } },
        { side: 'left', port: { id: 'p3', name: 'eth2' } },
      ] as any[];

      mockPortsService.convertPortEntityToPort.mockImplementation((p) => p);

      const handles = service.rowsToHandles(placements);

      expect(handles.left).toHaveLength(2);
      expect(handles.right).toHaveLength(1);
      expect(handles.top).toHaveLength(0);
      expect(handles.bottom).toHaveLength(0);
    });

    it('calls convertPortEntityToPort for each placement', () => {
      const placements = [
        { side: 'top', port: { id: 'p1' } },
      ] as any[];

      service.rowsToHandles(placements);

      expect(mockPortsService.convertPortEntityToPort).toHaveBeenCalledWith({ id: 'p1' });
    });
  });
});
