import { Test, TestingModule } from '@nestjs/testing';
import { LinesController } from './lines.controller';
import { LinessService } from './lines.service';

const mockLinesService = {
  getConnectedPortIdMap: jest.fn(),
  getBondPortSiblings: jest.fn(),
  getConnectedPortInfo: jest.fn(),
};

describe('LinesController', () => {
  let controller: LinesController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LinesController],
      providers: [{ provide: LinessService, useValue: mockLinesService }],
    }).compile();

    controller = module.get<LinesController>(LinesController);
  });

  // ── getConnectedPortIds ────────────────────────────────────────────────────

  describe('getConnectedPortIds', () => {
    it('returns object from connected port id map', async () => {
      mockLinesService.getConnectedPortIdMap.mockResolvedValue(
        new Map([['p1', 'p2'], ['p3', 'p4']]),
      );

      const result = await controller.getConnectedPortIds({ portIds: ['p1', 'p3'] });

      expect(mockLinesService.getConnectedPortIdMap).toHaveBeenCalledWith(['p1', 'p3']);
      expect(result).toEqual({ p1: 'p2', p3: 'p4' });
    });

    it('defaults to empty array when portIds is missing', async () => {
      mockLinesService.getConnectedPortIdMap.mockResolvedValue(new Map());

      const result = await controller.getConnectedPortIds({} as any);

      expect(mockLinesService.getConnectedPortIdMap).toHaveBeenCalledWith([]);
      expect(result).toEqual({});
    });
  });

  // ── getBondPortSiblings ────────────────────────────────────────────────────

  describe('getBondPortSiblings', () => {
    it('delegates to linesService.getBondPortSiblings and returns result', async () => {
      const siblings = { bondId: 'b-1', bondName: 'Bond A', sameSide: [], otherSide: [], memberLinePairs: [] };
      mockLinesService.getBondPortSiblings.mockResolvedValue(siblings);

      const result = await controller.getBondPortSiblings({ portId: 'p1', deviceId: 'dev-1' });

      expect(mockLinesService.getBondPortSiblings).toHaveBeenCalledWith('p1', 'dev-1');
      expect(result).toEqual(siblings);
    });

    it('returns null when no bond found', async () => {
      mockLinesService.getBondPortSiblings.mockResolvedValue(null);

      const result = await controller.getBondPortSiblings({ portId: 'p1', deviceId: 'dev-1' });

      expect(result).toBeNull();
    });
  });

  // ── getConnectedPortInfo ───────────────────────────────────────────────────

  describe('getConnectedPortInfo', () => {
    it('delegates to linesService.getConnectedPortInfo and returns result', async () => {
      const port = { id: 'p2', name: 'eth1', deviceId: 'dev-2' };
      mockLinesService.getConnectedPortInfo.mockResolvedValue(port);

      const result = await controller.getConnectedPortInfo({ portId: 'p1' });

      expect(mockLinesService.getConnectedPortInfo).toHaveBeenCalledWith('p1');
      expect(result).toEqual(port);
    });

    it('returns null when port is not connected', async () => {
      mockLinesService.getConnectedPortInfo.mockResolvedValue(null);

      const result = await controller.getConnectedPortInfo({ portId: 'p1' });

      expect(result).toBeNull();
    });
  });
});
