import { LockState, type ChartLock } from "@easy-charts/easycharts-types";
import { http } from "../api/http";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";


export const fetchLock = async (id: string): Promise<ChartLock> => {
  const { data } = await http.get<ChartLock>(`/charts/${id}/lock`);
  return data;
};

export const lockChart = async (id: string): Promise<ChartLock> => {
  const { data } = await http.patch<ChartLock>(`/charts/${id}/lock`);
  return data;
};

export const unlockChart = async (id: string): Promise<void> => {
  await http.patch(`/charts/${id}/unlock`);
};

export function useChartLock(userId:string,chartId?: string) {
  const qc = useQueryClient();

  const lockQ = useQuery({
    queryKey: ["chartLock", chartId],
    queryFn: () => fetchLock(chartId!),
    enabled: !!chartId,
    refetchInterval: 15000,
    staleTime: 10000,
  });

  const acquireMut = useMutation({
    mutationKey: ["acquireLock", chartId],
    mutationFn: () => lockChart(chartId!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chartLock", chartId] });
    },

  });

  const releaseMut = useMutation({
    mutationKey: ["releaseLock", chartId],
    mutationFn: () => unlockChart(chartId!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chartLock", chartId] });
    },
  });

  const getLockStatus = useCallback(() : LockState=>{
    return !lockQ.data?.lockedById
        ? LockState.UNLOCKED
        : lockQ.data.lockedById === userId
        ? LockState.MINE
        : LockState.OTHERs
  },[lockQ, userId])

  return {
    lock: {
      ...lockQ.data,
      state: getLockStatus()
    } as ChartLock,
    isLoading: lockQ.isLoading,
    refetch: lockQ.refetch,
    lockChart: () => acquireMut.mutateAsync(),
    unlockChart: () => releaseMut.mutateAsync(),
    locking: acquireMut.isPending,
    unlocking: releaseMut.isPending,
  };
}
