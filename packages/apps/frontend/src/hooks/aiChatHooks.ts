import type {
  AiStatusResponse,
  ChatRequest,
  ChatResponse,
} from "@easy-charts/easycharts-types";
import { useMutation, useQuery } from "@tanstack/react-query";
import { http } from "../api/http";

async function fetchAiStatus(): Promise<AiStatusResponse> {
  const { data } = await http.get<AiStatusResponse>("/ai/status");
  return data;
}

export function useAiStatus() {
  return useQuery<AiStatusResponse>({
    queryKey: ["aiStatus"],
    queryFn: fetchAiStatus,
    staleTime: Infinity, // status doesn't change at runtime — only on server restart
    retry: false,
  });
}

async function sendChatMessage(req: ChatRequest): Promise<ChatResponse> {
  try {
    const { data } = await http.post<ChatResponse>("/ai/chat", req);
    return data;
  } catch (err: unknown) {
    const e = err as { response?: { data?: { message?: string } }; message?: string };
    const m = e?.response?.data?.message ?? e?.message ?? "AI request failed";
    throw new Error(Array.isArray(m) ? m.join(", ") : m);
  }
}

export function useAiChatMutation() {
  return useMutation({
    mutationFn: (req: ChatRequest) => sendChatMessage(req),
  });
}
