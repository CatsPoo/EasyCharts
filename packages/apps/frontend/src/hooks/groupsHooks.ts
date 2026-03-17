import type {
  AddGroupMember,
  CreateGroup,
  Group,
  GroupChartShare,
  GroupDirectoryShare,
  UpdateGroup,
} from "@easy-charts/easycharts-types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { http } from "../api/http";

// ─── Groups CRUD ─────────────────────────────────────────────────────────────

async function fetchAllGroups(): Promise<Group[]> {
  const { data } = await http.get<Group[]>("/groups");
  return data;
}

async function fetchGroupById(id: string): Promise<Group> {
  const { data } = await http.get<Group>(`/groups/${id}`);
  return data;
}

async function createGroup(dto: CreateGroup): Promise<Group> {
  const { data } = await http.post<Group>("/groups", dto);
  return data;
}

async function updateGroup(id: string, dto: UpdateGroup): Promise<Group> {
  const { data } = await http.patch<Group>(`/groups/${id}`, dto);
  return data;
}

async function deleteGroup(id: string): Promise<void> {
  await http.delete(`/groups/${id}`);
}

export function useGroupsQuery() {
  return useQuery<Group[]>({
    queryKey: ["groups"],
    queryFn: fetchAllGroups,
  });
}

export function useGroupByIdQuery(id: string | null) {
  return useQuery<Group>({
    queryKey: ["groups", id],
    queryFn: () => fetchGroupById(id!),
    enabled: !!id,
  });
}

export function useCreateGroupMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateGroup) => createGroup(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["groups"] }),
  });
}

export function useUpdateGroupMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateGroup }) => updateGroup(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["groups"] }),
  });
}

export function useDeleteGroupMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteGroup(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["groups"] }),
  });
}

// ─── Group Members ────────────────────────────────────────────────────────────

type GroupMember = { id: string; username: string; displayName: string };

async function fetchGroupMembers(groupId: string): Promise<GroupMember[]> {
  const { data } = await http.get<GroupMember[]>(`/groups/${groupId}/members`);
  return data;
}

async function addGroupMember(groupId: string, dto: AddGroupMember): Promise<void> {
  await http.post(`/groups/${groupId}/members`, dto);
}

async function removeGroupMember(groupId: string, userId: string): Promise<void> {
  await http.delete(`/groups/${groupId}/members/${userId}`);
}

export function useGroupMembersQuery(groupId: string | null) {
  return useQuery<GroupMember[]>({
    queryKey: ["groups", groupId, "members"],
    queryFn: () => fetchGroupMembers(groupId!),
    enabled: !!groupId,
  });
}

export function useAddGroupMemberMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, userId }: { groupId: string; userId: string }) =>
      addGroupMember(groupId, { userId }),
    onSuccess: (_data, { groupId }) => qc.invalidateQueries({ queryKey: ["groups", groupId, "members"] }),
  });
}

export function useRemoveGroupMemberMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, userId }: { groupId: string; userId: string }) =>
      removeGroupMember(groupId, userId),
    onSuccess: (_data, { groupId }) => qc.invalidateQueries({ queryKey: ["groups", groupId, "members"] }),
  });
}

// ─── Group Chart Shares ───────────────────────────────────────────────────────

type GroupSharePerms = { canEdit: boolean; canDelete: boolean; canShare: boolean };

async function fetchChartGroupShares(chartId: string): Promise<GroupChartShare[]> {
  const { data } = await http.get<GroupChartShare[]>(`/charts/${chartId}/group-shares`);
  return data;
}

async function shareChartWithGroup(chartId: string, sharedWithGroupId: string, permissions: GroupSharePerms): Promise<void> {
  await http.post(`/charts/${chartId}/group-share`, { sharedWithGroupId, ...permissions });
}

async function unshareChartFromGroup(chartId: string, groupId: string): Promise<void> {
  await http.delete(`/charts/${chartId}/group-share/${groupId}`);
}

export function useChartGroupSharesQuery(chartId: string | null) {
  return useQuery<GroupChartShare[]>({
    queryKey: ["charts", chartId, "group-shares"],
    queryFn: () => fetchChartGroupShares(chartId!),
    enabled: !!chartId,
  });
}

export function useShareChartWithGroupMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ chartId, sharedWithGroupId, permissions }: { chartId: string; sharedWithGroupId: string; permissions: GroupSharePerms }) =>
      shareChartWithGroup(chartId, sharedWithGroupId, permissions),
    onSuccess: (_data, { chartId }) => qc.invalidateQueries({ queryKey: ["charts", chartId, "group-shares"] }),
  });
}

export function useUnshareChartFromGroupMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ chartId, groupId }: { chartId: string; groupId: string }) =>
      unshareChartFromGroup(chartId, groupId),
    onSuccess: (_data, { chartId }) => qc.invalidateQueries({ queryKey: ["charts", chartId, "group-shares"] }),
  });
}

// ─── Group Directory Shares ───────────────────────────────────────────────────

async function fetchDirectoryGroupShares(directoryId: string): Promise<GroupDirectoryShare[]> {
  const { data } = await http.get<GroupDirectoryShare[]>(`/chartsDirectories/${directoryId}/group-shares`);
  return data;
}

async function shareDirectoryWithGroup(
  directoryId: string,
  sharedWithGroupId: string,
  permissions: GroupSharePerms,
  includeContent: boolean,
): Promise<void> {
  await http.post(`/chartsDirectories/${directoryId}/group-share`, { sharedWithGroupId, ...permissions, includeContent });
}

async function unshareDirectoryFromGroup(directoryId: string, groupId: string): Promise<void> {
  await http.delete(`/chartsDirectories/${directoryId}/group-share/${groupId}`);
}

async function unshareDirectoryContentFromGroup(directoryId: string, groupId: string): Promise<void> {
  await http.delete(`/chartsDirectories/${directoryId}/group-share/${groupId}/content`);
}

export function useDirectoryGroupSharesQuery(directoryId: string | null) {
  return useQuery<GroupDirectoryShare[]>({
    queryKey: ["directories", directoryId, "group-shares"],
    queryFn: () => fetchDirectoryGroupShares(directoryId!),
    enabled: !!directoryId,
  });
}

export function useShareDirectoryWithGroupMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ directoryId, sharedWithGroupId, permissions, includeContent }: {
      directoryId: string; sharedWithGroupId: string; permissions: GroupSharePerms; includeContent: boolean;
    }) => shareDirectoryWithGroup(directoryId, sharedWithGroupId, permissions, includeContent),
    onSuccess: (_data, { directoryId }) => qc.invalidateQueries({ queryKey: ["directories", directoryId, "group-shares"] }),
  });
}

export function useUnshareDirectoryFromGroupMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ directoryId, groupId }: { directoryId: string; groupId: string }) =>
      unshareDirectoryFromGroup(directoryId, groupId),
    onSuccess: (_data, { directoryId }) => qc.invalidateQueries({ queryKey: ["directories", directoryId, "group-shares"] }),
  });
}

export function useUnshareDirectoryContentFromGroupMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ directoryId, groupId }: { directoryId: string; groupId: string }) =>
      unshareDirectoryContentFromGroup(directoryId, groupId),
    onSuccess: (_data, { directoryId }) => qc.invalidateQueries({ queryKey: ["directories", directoryId, "group-shares"] }),
  });
}
