import { useQuery, useMutation, useQueryClient, type UseQueryOptions} from '@tanstack/react-query';
import type { AssetMap, Device, DeviceUpdate, Model, ModelUpdate, Vendor, VendorUpdate } from '@easy-charts/easycharts-types';
import { http } from '../api/http';

// helpful alias
type ListResponse<K extends keyof AssetMap> = { rows: Array<AssetMap[K]>; total: number };

function serializeForApi(kind: keyof AssetMap, data: any, mode: 'create' | 'update') {
  switch (kind) {
    case 'vendors': {
      // Backend expects: { name, ... } (no nested refs)
      const {...rest } = data as Vendor ?? {};
      return rest as VendorUpdate;
    }

    case 'models': {
      if(mode === 'create')
        return data
      // Frontend: { name, vendor: { id, name, ... } }
      // Backend expects: { name, vendorId }
      const {vendor, ...rest } = data as Model ?? {};
      return {
        ...rest,
        vendorId: vendor?.id ?? null,
      } as ModelUpdate;
    }

    case 'devices': {
      const {id:_omit,model,vendor, ...rest } = data as Device ?? {};
      return {
        ...rest,
        modelId: model?.id ?? null,
      } as DeviceUpdate;
    }

    default: {
      const {...rest } = data ?? {};
      return rest;
    }
  }
}

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
      try{
        const qs = toQueryString(params);
        const { data } = await http.get(`/${kind}?${qs}`);
        return data
      }
      catch(err:any){ throw new Error("Failed to fetch");}
    },
    placeholderData: (prev) => prev,
    ...options,
  });
}


export function useCreateAsset<K extends keyof AssetMap>(kind: K) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: Omit<AssetMap[K], 'id'>) => {

      try {
        const { data } = await http.post(`/${kind}`, dto);
        return data;
      } catch (err: any) {
        throw new Error("Create failed");
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assets', kind] }),
  });
}

export function useUpdateAsset<K extends keyof AssetMap>(kind: K) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: AssetMap[K]) => {
      const id = (data as any).id as string;
      if (!id) throw new Error("Missing id for update");

      // Strip id from body and map nested objects → ids
      const { id: _omit, ...rest } = data as any;
      const payload = serializeForApi(kind, rest, "update");
      try {
        const { data } = await http.put(`/${kind}/${id}`, payload);
        return data;
      } catch {
        throw new Error("Update failed");
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assets", kind] });
    },
  });
}

export function useDeleteAsset<K extends keyof AssetMap>(kind: K) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      try {
        await http.delete(`/${kind}/${id}`);
      } catch {
        throw new Error("Delete failed");
      }
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