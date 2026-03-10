import type z from "zod";
import type {
  AiStatusResponseSchema,
  ChatChartActionSchema,
  ChatMessageSchema,
  ChatRequestSchema,
  ChatResponseSchema,
  CurrentPageSchema,
} from "./ai.schemas.js";

export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type ChatRequest = z.infer<typeof ChatRequestSchema>;
export type ChatChartAction = z.infer<typeof ChatChartActionSchema>;
export type ChatResponse = z.infer<typeof ChatResponseSchema>;
export type AiStatusResponse = z.infer<typeof AiStatusResponseSchema>;
export type CurrentPage = z.infer<typeof CurrentPageSchema>;
