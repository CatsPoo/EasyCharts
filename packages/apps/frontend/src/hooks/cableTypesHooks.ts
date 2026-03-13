import { useQuery } from "@tanstack/react-query";
import type { CableType } from "@easy-charts/easycharts-types";
import { http } from "../api/http";

export function useCableTypes() {
  return useQuery<CableType[]>({
    queryKey: ["cableTypes"],
    queryFn: async () => {
      const { data } = await http.get<{ rows: CableType[] }>("/cableTypes");
      return data.rows;
    },
    staleTime: 60_000,
  });
}

export function usePortTypes() {
  return useQuery<{ id: string; name: string }[]>({
    queryKey: ["portTypes"],
    queryFn: async () => {
      const { data } = await http.get<{ rows: { id: string; name: string }[] }>("/portTypes");
      return data.rows;
    },
    staleTime: 60_000,
  });
}
