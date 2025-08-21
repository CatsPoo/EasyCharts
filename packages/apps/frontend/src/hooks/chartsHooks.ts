import { type Chart, type ChartMetadata, type ChartCreate, type ChartUpdate, ChartUpdateSchema } from '@easy-charts/easycharts-types';
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

export function useCreateChartMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: ChartCreate) => createChart(dto),
    onSuccess: () => {
      // refresh list
      qc.invalidateQueries({ queryKey: ['chartsMetadata'] });
    },
  });
}

export async function getChartsMetadata(): Promise<ChartMetadata[]> {
  const response = await fetch('/api/charts/metadata'); // adjust base path if needed
  if (!response.ok) {
    throw new Error('Failed to fetch chart metadata');
  }
  return await response.json();
}

export function useChartsMetadataQuery() {
  return useQuery<ChartMetadata[]>({
    queryKey: ['chartsMetadata'],
    queryFn: getChartsMetadata,
  });
}

export async function getChartById(chartId: string): Promise<Chart> {
  const response = await fetch(`/api/charts/${chartId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch metadata for chart ID: ${chartId}`);
  }
  const res1 = await  response.json()
  console.log(res1)
  return res1
  //return await response.json() as Chart;
}

export function useChartById(id: string) {
  return useQuery<Chart>({
    queryKey: ['chart', id],
    queryFn: () => getChartById(id),
    enabled: !!id,
  });
}

export async function updateChart(id: string, data: ChartUpdate): Promise<Chart> {
  const res = await fetch(`/api/charts/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
   return (await res.json()) as Chart;
}

