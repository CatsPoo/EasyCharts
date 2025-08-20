import { useQuery, useMutation, useQueryClient, type UseQueryOptions} from '@tanstack/react-query';
import type { AssetMap } from '@easy-charts/easycharts-types';

// helpful alias
type ListResponse<K extends keyof AssetMap> = { rows: Array<AssetMap[K]>; total: number };

export function useListAssets<K extends keyof AssetMap>(
  kind: K,
  params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    sortBy?: string;
    sortDir?: "asc" | "desc";
  },
  options?: UseQueryOptions<ListResponse<K>>
) {
  return useQuery<ListResponse<K>>({
    queryKey: ["assets", kind, params] as const,
    queryFn: async () => {
      const qs = toQueryString(params);
      const res = await fetch(`/api/${kind}?${qs}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return (await res.json()) as ListResponse<K>;
    },
    placeholderData: (prev) => prev,
    ...options,
  });
}


export function useCreateAsset<K extends keyof AssetMap>(kind: K) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<AssetMap[K], 'id'>) => {
      const res = await fetch(`/api/${kind}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Create failed');
      return res.json() as Promise<AssetMap[K]>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assets', kind] }),
  });
}

export function useUpdateAsset<K extends keyof AssetMap>(kind: K) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: AssetMap[K]) => {
      const id = (data as any).id as string;
      // strip id from the payload
      const { id: _omit, ...put } = data as any;

      const res = await fetch(`/api/${kind}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(put),
      });
      if (!res.ok) throw new Error('Update failed');
      return res.json() as Promise<AssetMap[K]>;
    },
    onSuccess: (_data, _vars, _ctx) => {
      qc.invalidateQueries({ queryKey: ['assets', kind] });
    },
  });
}

export function useDeleteAsset<K extends keyof AssetMap>(kind: K) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/${kind}/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      return true;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assets', kind] }),
  });
}

function toQueryString(params?: Record<string, unknown>) {
  const sp = new URLSearchParams();
  if (!params) return '';
  for (const [key, val] of Object.entries(params)) {
    if (val == null || val === '') continue;       // drop undefined/null/empty
    sp.set(key, String(val));                      // <-- stringify numbers/booleans
  }
  return sp.toString();
}