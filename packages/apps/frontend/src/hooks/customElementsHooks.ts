import { useQuery } from "@tanstack/react-query";
import type { CustomElement } from "@easy-charts/easycharts-types";
import { http } from "../api/http";

export function useListCustomElements() {
  return useQuery<{ rows: CustomElement[]; total: number }>({
    queryKey: ["assets", "customElements", { pageSize: 500 }],
    queryFn: async () => {
      const { data } = await http.get("/customElements?pageSize=500");
      return data;
    },
    placeholderData: (prev) => prev,
  });
}
