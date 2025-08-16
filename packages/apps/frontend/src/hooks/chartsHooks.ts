import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Chart, chartMetadata, CreateChartDto } from '@easy-charts/easycharts-types';


export async function createChart(dto: CreateChartDto): Promise<Chart> {
  const res = await fetch(`api/charts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
    credentials: 'include',
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || `Failed to create chart (${res.status})`);
  }
  return res.json();
}

export async function getChartsMetadata(): Promise<chartMetadata[]> {
  const res = await fetch(`/api/charts/metadata`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch charts');
  return res.json();
}

export function useChartsMetadataQuery() {
  return useQuery<chartMetadata[]>({
    queryKey: ['charts'],
    queryFn: getChartsMetadata,
  });
}

export function useCreateChartMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateChartDto) => createChart(dto),
    onSuccess: () => {
      // refresh list
      qc.invalidateQueries({ queryKey: ['charts'] });
    },
  });
}
