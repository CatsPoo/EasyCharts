import { useQuery } from "@tanstack/react-query";
import type { OverlayElement } from "@easy-charts/easycharts-types";
import { http } from "../api/http";

export function useListOverlayElements() {
  return useQuery<{ rows: OverlayElement[]; total: number }>({
    queryKey: ["assets", "overlayElements", { pageSize: 500 }],
    queryFn: async () => {
      const { data } = await http.get("/overlayElements?pageSize=500");
      return data;
    },
    placeholderData: (prev) => prev,
  });
}
