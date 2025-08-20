import type { Chart, ChartMetadata, ChartCreate } from '@easy-charts/easycharts-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';


export async function createChart(dto: ChartCreate): Promise<Chart> {
  const res = await fetch(`api/charts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
    credentials: "include",
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || `Failed to create chart (${res.status})`);
  }
  return res.json();
}

export async function getChartsMetadata(): Promise<ChartMetadata[]> {
  const res = await fetch(`/api/charts/metadata`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch charts');
  return res.json();
}

export function useChartsMetadataQuery() {
  return useQuery<ChartMetadata[]>({
    queryKey: ['charts'],
    queryFn: getChartsMetadata,
  });
}

export function useCreateChartMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: ChartCreate) => createChart(dto),
    onSuccess: () => {
      // refresh list
      qc.invalidateQueries({ queryKey: ['charts'] });
    },
  });
}
