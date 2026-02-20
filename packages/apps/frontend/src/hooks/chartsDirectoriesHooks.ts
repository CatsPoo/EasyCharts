import type {
  ChartsDirectory,
  ChartMetadata,
  ChartShare,
  CreateChartDirectory,
  DirectoryShare,
  UpadateChartDirectory,
} from "@easy-charts/easycharts-types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { http } from "../api/http";

type SharePermissions = { canEdit?: boolean; canDelete?: boolean; canShare?: boolean };

// ─── Directory CRUD ──────────────────────────────────────────────────────────

async function listRootDirectories(): Promise<ChartsDirectory[]> {
  const { data } = await http.get<ChartsDirectory[]>("/chartsDirectories");
  return data;
}

async function listChildDirectories(parentId: string): Promise<ChartsDirectory[]> {
  const { data } = await http.get<ChartsDirectory[]>(`/chartsDirectories/${parentId}/children`);
  return data;
}

async function createDirectory(dto: CreateChartDirectory): Promise<ChartsDirectory> {
  const { data } = await http.post<ChartsDirectory>("/chartsDirectories", dto);
  return data;
}

async function updateDirectory(id: string, dto: UpadateChartDirectory): Promise<ChartsDirectory> {
  const { data } = await http.put<ChartsDirectory>(`/chartsDirectories/${id}`, dto);
  return data;
}

async function deleteDirectory(id: string): Promise<void> {
  await http.delete(`/chartsDirectories/${id}`);
}

export function useRootDirectoriesQuery() {
  return useQuery<ChartsDirectory[]>({
    queryKey: ["directories", "roots"],
    queryFn: listRootDirectories,
  });
}

export function useChildDirectoriesQuery(parentId: string | null) {
  return useQuery<ChartsDirectory[]>({
    queryKey: ["directories", "children", parentId],
    queryFn: () => listChildDirectories(parentId!),
    enabled: !!parentId,
  });
}

export function useCreateDirectoryMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateChartDirectory) => createDirectory(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["directories"] });
    },
  });
}

export function useUpdateDirectoryMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpadateChartDirectory }) =>
      updateDirectory(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["directories"] });
    },
  });
}

export function useDeleteDirectoryMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteDirectory(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["directories"] });
    },
  });
}

// ─── Charts in directory ─────────────────────────────────────────────────────

async function listDirectoryChartIds(directoryId: string): Promise<string[]> {
  const { data } = await http.get<string[]>(
    `/chartsDirectories/${directoryId}/charts/ids`,
  );
  return data;
}

async function listDirectoryChartsMetadata(directoryId: string): Promise<ChartMetadata[]> {
  const { data } = await http.get<ChartMetadata[]>(
    `/chartsDirectories/${directoryId}/charts/metadata`,
  );
  return data;
}

async function addChartToDirectory(directoryId: string, chartId: string): Promise<void> {
  await http.post(`/chartsDirectories/${directoryId}/charts/${chartId}`);
}

async function removeChartFromDirectory(directoryId: string, chartId: string): Promise<void> {
  await http.delete(`/chartsDirectories/${directoryId}/charts/${chartId}`);
}

export function useDirectoryChartIdsQuery(directoryId: string | null) {
  return useQuery<string[]>({
    queryKey: ["directoryCharts", directoryId],
    queryFn: () => listDirectoryChartIds(directoryId!),
    enabled: !!directoryId,
  });
}

export function useDirectoryChartsMetadataQuery(directoryId: string | null) {
  return useQuery<ChartMetadata[]>({
    queryKey: ["directoryChartsMetadata", directoryId],
    queryFn: () => listDirectoryChartsMetadata(directoryId!),
    enabled: !!directoryId,
  });
}

export function useAddChartToDirectoryMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ directoryId, chartId }: { directoryId: string; chartId: string }) =>
      addChartToDirectory(directoryId, chartId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["directoryChartsMetadata"] });
      qc.invalidateQueries({ queryKey: ["directoryCharts"] });
      qc.invalidateQueries({ queryKey: ["chartsMetadata", "unassigned"] });
    },
  });
}

export function useRemoveChartFromDirectoryMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ directoryId, chartId }: { directoryId: string; chartId: string }) =>
      removeChartFromDirectory(directoryId, chartId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["directoryChartsMetadata"] });
      qc.invalidateQueries({ queryKey: ["directoryCharts"] });
      qc.invalidateQueries({ queryKey: ["chartsMetadata", "unassigned"] });
    },
  });
}

// ─── Unassigned charts ───────────────────────────────────────────────────────

async function getUnassignedChartMetadata(): Promise<ChartMetadata[]> {
  const { data } = await http.get<ChartMetadata[]>("/charts/metadata/unassigned");
  return data;
}

export function useUnassignedChartsQuery() {
  return useQuery<ChartMetadata[]>({
    queryKey: ["chartsMetadata", "unassigned"],
    queryFn: getUnassignedChartMetadata,
  });
}

// ─── Directory sharing ───────────────────────────────────────────────────────

async function getDirectoryShares(directoryId: string): Promise<DirectoryShare[]> {
  const { data } = await http.get<DirectoryShare[]>(`/chartsDirectories/${directoryId}/shares`);
  return data;
}

async function shareDirectory(
  directoryId: string,
  sharedWithUserId: string,
  permissions: SharePermissions = {},
  includeContent = false,
): Promise<void> {
  await http.post(`/chartsDirectories/${directoryId}/share`, {
    sharedWithUserId,
    canEdit: permissions.canEdit ?? false,
    canDelete: permissions.canDelete ?? false,
    canShare: permissions.canShare ?? false,
    includeContent,
  });
}

async function unshareDirectory(directoryId: string, sharedWithUserId: string): Promise<void> {
  await http.delete(`/chartsDirectories/${directoryId}/share/${sharedWithUserId}`);
}

export function useDirectorySharesQuery(directoryId: string | null) {
  return useQuery<DirectoryShare[]>({
    queryKey: ["directoryShares", directoryId],
    queryFn: () => getDirectoryShares(directoryId!),
    enabled: !!directoryId,
  });
}

export function useShareDirectoryMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      directoryId,
      sharedWithUserId,
      permissions = {},
      includeContent = false,
    }: { directoryId: string; sharedWithUserId: string; permissions?: SharePermissions; includeContent?: boolean }) =>
      shareDirectory(directoryId, sharedWithUserId, permissions, includeContent),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["directoryShares", vars.directoryId] });
    },
  });
}

export function useUnshareDirectoryMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ directoryId, sharedWithUserId }: { directoryId: string; sharedWithUserId: string }) =>
      unshareDirectory(directoryId, sharedWithUserId),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["directoryShares", vars.directoryId] });
    },
  });
}

// ─── Chart sharing ───────────────────────────────────────────────────────────

async function getChartShares(chartId: string): Promise<ChartShare[]> {
  const { data } = await http.get<ChartShare[]>(`/charts/${chartId}/shares`);
  return data;
}

async function shareChart(
  chartId: string,
  sharedWithUserId: string,
  permissions: SharePermissions = {},
): Promise<void> {
  await http.post(`/charts/${chartId}/share`, {
    sharedWithUserId,
    canEdit: permissions.canEdit ?? false,
    canDelete: permissions.canDelete ?? false,
    canShare: permissions.canShare ?? false,
  });
}

async function unshareChart(chartId: string, sharedWithUserId: string): Promise<void> {
  await http.delete(`/charts/${chartId}/share/${sharedWithUserId}`);
}

export function useChartSharesQuery(chartId: string | null) {
  return useQuery<ChartShare[]>({
    queryKey: ["chartShares", chartId],
    queryFn: () => getChartShares(chartId!),
    enabled: !!chartId,
  });
}

export function useShareChartMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      chartId,
      sharedWithUserId,
      permissions = {},
    }: { chartId: string; sharedWithUserId: string; permissions?: SharePermissions }) =>
      shareChart(chartId, sharedWithUserId, permissions),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["chartShares", vars.chartId] });
      qc.invalidateQueries({ queryKey: ["chartsMetadata"] });
    },
  });
}

export function useUnshareChartMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ chartId, sharedWithUserId }: { chartId: string; sharedWithUserId: string }) =>
      unshareChart(chartId, sharedWithUserId),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["chartShares", vars.chartId] });
      qc.invalidateQueries({ queryKey: ["chartsMetadata"] });
    },
  });
}
