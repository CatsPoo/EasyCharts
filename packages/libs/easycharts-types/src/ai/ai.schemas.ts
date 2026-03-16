;import z from "zod";
import { ChartDirectoryFullContentSchema } from "../chartsDirectories/schemas/chartsDirectories.schema.js";
import { PositionSchema } from "../charts/schemas/position.schema.js";
import { ChartMetadataSchema, ChartSchema } from "../charts/schemas/chart.schemas.js";
import { DeviceSchema } from "../devices/schemas/device.schemas.js";
import { PortSchema } from "../devices/schemas/port.schemas.js";

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
  /** Current in-editor chart state (may include unsaved user changes) */
  currentChartState: z.unknown().optional(),
});

export const ChatChartActionSchema = z.object({
  type: z.enum(["edit","create", "open"]),
  chartId: z.string().uuid(),
});

/** UI actions the AI wants applied to the live chart editor (not saved to DB yet).
 *  Each action operates on a list so the AI can batch multiple items in a single tool call. */
export const UIActionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("add_device"),
    device: z.object({
      deviceId: z.string(),
      position: PositionSchema,
    }),
  }),
  z.object({
    type: z.literal("remove_device"),
    deviceId: z.string(),
  }),
  z.object({
    type: z.literal("move_device"),
    device: z.object({ deviceId: z.string(), position: PositionSchema }),
  }),
  z.object({
    type: z.literal("connect_ports"),
    connection: z.object({
      sourceDeviceId: z.string(),
      sourcePortId: z.string(),
      targetDeviceId: z.string(),
      targetPortId: z.string(),
    }),
  }),
  z.object({
    type: z.literal("disconnect_ports"),
    connection: z.object({
      sourcePortId: z.string(),
      targetPortId: z.string(),
    }),
  }),
]);

export const ChatResponseSchema = z.object({
  message: z.string(),
  chartAction: ChatChartActionSchema.optional(),
  /** UI actions to apply to the live chart editor */
  uiActions: z.array(UIActionSchema).optional(),
});

export const AiStatusResponseSchema = z.object({
  enabled: z.boolean(),
});

export const AiToolListResponseSchema = z.array(
  ChartMetadataSchema)
  .or(ChartSchema)
  .or(z.array(DeviceSchema))
  .or(DeviceSchema)
  .or(ChartDirectoryFullContentSchema)
  .or(PortSchema)


export const UiOpenChartResponse = z.object({
  chartname:z.string,
  editMode:z.boolean()
})

export const AiToolUiResponseSchema = UiOpenChartResponse 

export const AiToolResponseSchema = z.object({
  aiToolListResonse: AiToolListResponseSchema.optional(),
  aiToolUiResponse:AiToolUiResponseSchema.optional(),
  message: z.string().optional()
});