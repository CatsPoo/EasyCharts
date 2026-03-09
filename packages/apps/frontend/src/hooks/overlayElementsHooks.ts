import { useQuery } from "@tanstack/react-query";
import type { OverlayElement, OverlayElementType } from "@easy-charts/easycharts-types";
import { http } from "../api/http";

export function useListOverlayElements(type?: OverlayElementType) {
  return useQuery<{ rows: OverlayElement[]; total: number }>({
    queryKey: ["assets", "overlayElements", { type, pageSize: 500 }],
    queryFn: async () => {
      const params = new URLSearchParams({ pageSize: "500" });
      if (type) params.set("type", type);
      const { data } = await http.get(`/overlayElements?${params}`);
      return data;
    },
    placeholderData: (prev) => prev,
  });
}
