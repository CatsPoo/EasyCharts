import { type Chart, type ChartVersion, type ChartVersionMeta } from '@easy-charts/easycharts-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { http } from '../api/http';

export async function getChartVersions(chartId: string): Promise<ChartVersionMeta[]> {
  const { data } = await http.get<ChartVersionMeta[]>(`/charts/${chartId}/versions`);
  return data;
}

export async function getChartVersion(chartId: string, versionId: string): Promise<ChartVersion> {
  const { data } = await http.get<ChartVersion>(`/charts/${chartId}/versions/${versionId}`);
  return data;
}

export async function rollbackChartVersion(chartId: string, versionId: string): Promise<Chart> {
  const { data } = await http.post<Chart>(`/charts/${chartId}/versions/${versionId}/rollback`);
  return data;
}

export function useChartVersions(chartId: string) {
  return useQuery<ChartVersionMeta[]>({
    queryKey: ['chartVersions', chartId],
    queryFn: () => getChartVersions(chartId),
    enabled: !!chartId,
  });
}

export function useRollbackChartVersion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ chartId, versionId }: { chartId: string; versionId: string }) =>
      rollbackChartVersion(chartId, versionId),
    onSuccess: (saved) => {
      qc.setQueryData(['chart', saved.id], saved);
      qc.invalidateQueries({ queryKey: ['chart', saved.id] });
      qc.invalidateQueries({ queryKey: ['chartVersions', saved.id] });
      qc.invalidateQueries({ queryKey: ['chartsMetadata'] });
    },
  });
}
