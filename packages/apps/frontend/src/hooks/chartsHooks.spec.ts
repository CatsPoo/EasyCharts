// Mock ../api/http before importing the hooks so the http singleton is replaced
import { http } from '../api/http';
import {
  createChart,
  deleteChart,
  getChartById,
  getChartsMetadata,
  updateChart,
} from './chartsHooks';

jest.mock('../api/http', () => ({
  http: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

// Cast to jest.Mocked for type-safe mock access
const mockHttp = http as jest.Mocked<typeof http>;

const mockChart = {
  id: 'chart-1',
  name: 'Test Chart',
  description: '',
  devicesOnChart: [],
  linesOnChart: [],
  bondsOnChart: [],
  notesOnChart: [],
  zonesOnChart: [],
  cloudsOnChart: [],
};

const mockMetadata = [{ id: 'chart-1', name: 'Test Chart', description: '' }];

describe('Chart API functions', () => {
  beforeEach(() => jest.clearAllMocks());

  // ── createChart ─────────────────────────────────────────────────────────────

  describe('createChart', () => {
    it('POSTs to /charts and returns the created chart', async () => {
      (mockHttp.post as jest.Mock).mockResolvedValue({ data: mockChart });

      const dto = { name: 'Test Chart', description: '', devicesOnChart: [] } as any;
      const result = await createChart(dto);

      expect(mockHttp.post).toHaveBeenCalledWith('/charts', dto);
      expect(result).toEqual(mockChart);
    });

    it('throws Error with server message on API failure', async () => {
      (mockHttp.post as jest.Mock).mockRejectedValue({
        response: { data: { message: 'Chart name already taken' } },
      });

      await expect(
        createChart({ name: 'Test', description: '', devicesOnChart: [] } as any),
      ).rejects.toThrow('Chart name already taken');
    });

    it('joins array messages with comma', async () => {
      (mockHttp.post as jest.Mock).mockRejectedValue({
        response: { data: { message: ['Field A is required', 'Field B is invalid'] } },
      });

      await expect(
        createChart({ name: '', description: '', devicesOnChart: [] } as any),
      ).rejects.toThrow('Field A is required, Field B is invalid');
    });

    it('falls back to generic message when no server message', async () => {
      (mockHttp.post as jest.Mock).mockRejectedValue({});

      await expect(
        createChart({ name: 'Test', description: '', devicesOnChart: [] } as any),
      ).rejects.toThrow('Failed to create chart');
    });
  });

  // ── getChartsMetadata ───────────────────────────────────────────────────────

  describe('getChartsMetadata', () => {
    it('GETs /charts/metadata and returns array', async () => {
      (mockHttp.get as jest.Mock).mockResolvedValue({ data: mockMetadata });

      const result = await getChartsMetadata();
      expect(mockHttp.get).toHaveBeenCalledWith('/charts/metadata');
      expect(result).toEqual(mockMetadata);
    });

    it('throws generic error on API failure', async () => {
      (mockHttp.get as jest.Mock).mockRejectedValue(new Error('Network error'));
      await expect(getChartsMetadata()).rejects.toThrow('Failed to fetch chart metadata');
    });
  });

  // ── getChartById ────────────────────────────────────────────────────────────

  describe('getChartById', () => {
    it('GETs /charts/:id and returns chart', async () => {
      (mockHttp.get as jest.Mock).mockResolvedValue({ data: mockChart });

      const result = await getChartById('chart-1');
      expect(mockHttp.get).toHaveBeenCalledWith('/charts/chart-1');
      expect(result).toEqual(mockChart);
    });

    it('throws Error containing the chart id on failure', async () => {
      (mockHttp.get as jest.Mock).mockRejectedValue(new Error());
      await expect(getChartById('chart-99')).rejects.toThrow('chart-99');
    });
  });

  // ── updateChart ─────────────────────────────────────────────────────────────

  describe('updateChart', () => {
    it('PATCHes /charts/:id with dto and returns updated chart', async () => {
      const updated = { ...mockChart, name: 'Updated Name' };
      (mockHttp.patch as jest.Mock).mockResolvedValue({ data: updated });

      const dto = { name: 'Updated Name' } as any;
      const result = await updateChart('chart-1', dto);

      expect(mockHttp.patch).toHaveBeenCalledWith('/charts/chart-1', dto);
      expect(result.name).toBe('Updated Name');
    });

    it('throws Error on API failure', async () => {
      (mockHttp.patch as jest.Mock).mockRejectedValue(new Error('Server error'));
      await expect(updateChart('chart-1', {} as any)).rejects.toThrow();
    });
  });

  // ── deleteChart ─────────────────────────────────────────────────────────────

  describe('deleteChart', () => {
    it('DELETEs /charts/:id', async () => {
      (mockHttp.delete as jest.Mock).mockResolvedValue({ data: undefined });

      await deleteChart('chart-1');
      expect(mockHttp.delete).toHaveBeenCalledWith('/charts/chart-1');
    });

    it('throws Error on API failure', async () => {
      (mockHttp.delete as jest.Mock).mockRejectedValue(new Error('Not found'));
      await expect(deleteChart('chart-1')).rejects.toThrow();
    });
  });
});
