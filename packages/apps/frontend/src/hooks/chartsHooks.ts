import { type Chart, type ChartMetadata, type ChartCreate, type ChartUpdate, ChartUpdateSchema } from '@easy-charts/easycharts-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { http } from '../api/http';


export async function createChart(dto: ChartCreate): Promise<Chart> {
  try{
    const { data }= await http.post<Chart>("/api/charts", dto);
    return data
  }
  catch (err: any) {
    // Nice error extraction (works with NestJS's { message } or { message: string[] })
    const m = err?.response?.data?.message ?? err?.message ?? "Failed to create chart";
    throw new Error(Array.isArray(m) ? m.join(", ") : m);
  }
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
  try{
    const {data} = await http.get<ChartMetadata[]>('/api/charts/metadata');
    return data
  }
  catch(err:any){
    throw new Error('Failed to fetch chart metadata');
  }
}

export function useChartsMetadataQuery() {
  return useQuery<ChartMetadata[]>({
    queryKey: ['chartsMetadata'],
    queryFn: getChartsMetadata,
  });
}

export async function getChartById(chartId: string): Promise<Chart> {
  try{
    const {data} = await http.get<Chart>(`/api/charts/${chartId}`);
    return data
  }
  catch(err:any){
    throw new Error(`Failed to fetch metadata for chart ID: ${chartId}`);
  }
}

export function useChartById(id: string) {
  return useQuery<Chart>({
    queryKey: ['chart', id],
    queryFn: () => getChartById(id),
    enabled: !!id,
  });
}

export async function updateChart(id: string, dto: ChartUpdate): Promise<Chart> {
  try{
    const {data} = await http.patch<Chart>(`/api/charts/${id}`, dto);
    return data
  }
  catch(err:any){
    throw new Error(err || `Failed to update chart ${err}`);
  }
}

export function useUpdateChartMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ChartUpdate }) => updateChart(id, data),
    onSuccess: (saved, vars) => {
      // EITHER directly update cache to avoid a refetch:
      qc.setQueryData(['chart', saved.id], saved);

      // AND/OR invalidate so useChartById refetches:
      qc.invalidateQueries({ queryKey: ['chart', vars.id] });

      // if your list shows names, also refresh metadata list
      qc.invalidateQueries({ queryKey: ['chartsMetadata'] });
    },
  });
}

export async function deleteChart(id: string): Promise<void> {
  try{
    await http.delete<void>(`/api/charts/${id}`);
  }
  catch(err:any){
    throw new Error(err || `Failed to delete chart)`);
  }
}

export function useDeleteChartMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id}: { id: string }) => deleteChart(id),
    onSuccess: (saved, vars) => {

      // AND/OR invalidate so useChartById refetches:
      qc.invalidateQueries({ queryKey: ['chart', vars.id] });

      // if your list shows names, also refresh metadata list
      qc.invalidateQueries({ queryKey: ['chartsMetadata'] });
    },
  });
}


