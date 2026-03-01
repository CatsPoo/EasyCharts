import { type AssetVersion, type AssetVersionMeta, type AssetKind } from '@easy-charts/easycharts-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { http } from '../api/http';

export async function getAssetVersions(kind: AssetKind, assetId: string): Promise<AssetVersionMeta[]> {
  const { data } = await http.get<AssetVersionMeta[]>(`/asset-versions/${kind}/${assetId}`);
  return data;
}

export async function rollbackAssetVersion(
  kind: AssetKind,
  assetId: string,
  versionId: string,
): Promise<unknown> {
  const { data } = await http.post(`/asset-versions/${kind}/${assetId}/${versionId}/rollback`);
  return data;
}

export function useAssetVersions(kind: AssetKind, assetId: string | null | undefined) {
  return useQuery<AssetVersionMeta[]>({
    queryKey: ['assetVersions', kind, assetId],
    queryFn: () => getAssetVersions(kind, assetId!),
    enabled: !!assetId,
  });
}

export function useRollbackAssetVersion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      kind,
      assetId,
      versionId,
    }: {
      kind: AssetKind;
      assetId: string;
      versionId: string;
    }) => rollbackAssetVersion(kind, assetId, versionId),
    onSuccess: (_result, vars) => {
      qc.invalidateQueries({ queryKey: ['assets', vars.kind] });
      qc.invalidateQueries({ queryKey: ['assetVersions', vars.kind, vars.assetId] });
    },
  });
}
