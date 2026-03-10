import z from "zod";

export const ChatRoleSchema = z.enum(["user", "assistant"]);

export const ChatMessageSchema = z.object({
  role: ChatRoleSchema,
  content: z.string(),
});

export const CurrentPageSchema = z.enum(["charts", "assets", "users"]);

export const ChatRequestSchema = z.object({
  messages: z.array(ChatMessageSchema).min(1),
  currentChartId: z.string().uuid().optional(),
  /** True when the user has the chart editor open in edit mode */
  editorEditMode: z.boolean().optional(),
  /** Which page/view the user is currently on */
  currentPage: CurrentPageSchema.optional(),
});

export const ChatChartActionSchema = z.object({
  type: z.enum(["create", "edit", "open"]),
  chartId: z.string().uuid(),
  chartName: z.string(),
});

export const ChatResponseSchema = z.object({
  message: z.string(),
  chartAction: ChatChartActionSchema.optional(),
});

export const AiStatusResponseSchema = z.object({
  enabled: z.boolean(),
});
