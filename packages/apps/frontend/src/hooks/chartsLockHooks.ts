import { LockState, type ChartLock } from "@easy-charts/easycharts-types";
import { http } from "../api/http";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";


export const fetchLock = async (id: string): Promise<ChartLock> => {
  const { data } = await http.get<ChartLock>(`/charts/${id}/lock`);
  return {
    chartId:data?.chartId,
    lockedById: data.lockedById ?? null,
    lockedAt: data.lockedAt ?? null,
    lockedByName: data.lockedByName ?? "",
  };
};

export const lockChart = async (id: string): Promise<ChartLock> => {
  const { data } = await http.patch<ChartLock>(`/charts/${id}/lock`);
  return data;
};

export const unlockChart = async (id: string): Promise<void> => {
  await http.patch(`/charts/${id}/unlock`);
};

export function useChartLock(userId: string, chartId?: string) {
  const qc = useQueryClient();

  // Provide a correct-shaped initial object as soon as we have an id
  const initialLock: ChartLock | undefined = chartId
    ? { chartId, lockedById: null, lockedAt: null, lockedByName: "" }
    : undefined;

  // Mutations first so we can pause polling while they run
  const acquireMut = useMutation({
    mutationKey: ["acquireLock", chartId],
    mutationFn: () => lockChart(chartId!),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ["chartLock", chartId] });
    },
    onSuccess: (lock) => {
      qc.setQueryData<ChartLock>(["chartLock", chartId], lock);
    },
  });

  const releaseMut = useMutation({
    mutationKey: ["releaseLock", chartId],
    mutationFn: () => unlockChart(chartId!),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ["chartLock", chartId] });
      // optimistic: write "unlocked" object, not null
      qc.setQueryData<ChartLock>(["chartLock", chartId], {
        chartId: chartId!,
        lockedById: null,
        lockedAt: null,
        lockedByName: "",
      });
    },
    // onSuccess: no-op; we already wrote the unlocked state
    // onError: optionally rollback from context if you want
  });

  // Main query: fetch immediately when chartId appears; pause during mutations
  const lockQ = useQuery({
    queryKey: ["chartLock", chartId],
    queryFn: () => fetchLock(chartId!),
    enabled: !!chartId && !acquireMut.isPending && !releaseMut.isPending,
    initialData: initialLock,
    refetchOnMount: "always", // fetch immediately on mount/id change
    staleTime: 0,
    refetchOnWindowFocus: false,
    retry: false,
    refetchInterval: (q) => {
      const data = q.state.data as ChartLock | undefined;
      if (!data?.lockedById) return 30000;         // unlocked → slower poll
      return data.lockedById === userId ? 10000 : 15000;
    },
  });

  // Derived state
  const state: LockState =
    !lockQ.data?.lockedById
      ? LockState.UNLOCKED
      : lockQ.data.lockedById === userId
      ? LockState.MINE
      : LockState.OTHERs; // use your actual enum key if different

  return {
    // Single source of truth from the query cache
    lock: lockQ.data,                    // ChartLock (once chartId exists)
    state,
    isLoading: lockQ.isLoading,
    isFetching: lockQ.isFetching,
    refetch: lockQ.refetch,

    // actions
    lockChart: () => acquireMut.mutateAsync(),
    unlockChart: () => releaseMut.mutateAsync(),

    // action states
    locking: acquireMut.isPending,
    unlocking: releaseMut.isPending,
    error:
      (lockQ.error as unknown) ?? acquireMut.error ?? releaseMut.error ?? null,
  };
}