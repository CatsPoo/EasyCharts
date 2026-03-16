import type z from "zod";
import {
  AiToolResponseSchema,
  type AiStatusResponseSchema,
  type ChatChartActionSchema,
  type ChatMessageSchema,
  type ChatRequestSchema,
  type ChatResponseSchema,
  type CurrentPageSchema,
  type UIActionSchema,
} from "./ai.schemas.js";

export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type ChatRequest = z.infer<typeof ChatRequestSchema>;
export type ChatChartAction = z.infer<typeof ChatChartActionSchema>;
export type ChatResponse = z.infer<typeof ChatResponseSchema>;
export type AiStatusResponse = z.infer<typeof AiStatusResponseSchema>;
export type CurrentPage = z.infer<typeof CurrentPageSchema>;
export type UIAction = z.infer<typeof UIActionSchema>;
export type AiToolResponse = z.infer<typeof AiToolResponseSchema>

