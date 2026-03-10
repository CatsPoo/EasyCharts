import type { ChatMessage, ChatResponse, ChartMetadata, CurrentPage } from "@easy-charts/easycharts-types";
import { Permission } from "@easy-charts/easycharts-types";
import {
  ForbiddenException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from "@nestjs/common";
import OpenAI from "openai";
import type { ChatCompletionMessageParam, ChatCompletionTool } from "openai/resources/chat/completions";
import { AppConfigService } from "../appConfig/appConfig.service";
import { UsersService } from "../auth/user.service";
import { ChartsService } from "../charts/charts.service";
import { DevicesService } from "../devices/devices.service";

const TOOLS: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "list_charts",
      description:
        "List all charts the current user has access to (owned + shared). Returns chart id, name, description, and the user's privileges on each chart.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_chart",
      description:
        "Get the full details of a specific chart (devices, positions). Only works for charts the user can access.",
      parameters: {
        type: "object",
        properties: {
          chartId: { type: "string", description: "UUID of the chart to retrieve" },
        },
        required: ["chartId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_devices",
      description:
        "List all available device types (servers, routers, switches, etc.) that can be placed on a chart. Always call this before create_chart.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "create_chart",
      description:
        "Create a new network diagram chart. Requires the chart:create global permission. Always call list_devices first to get valid device IDs.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Name of the chart" },
          description: { type: "string", description: "Brief description of the chart's purpose" },
          devices: {
            type: "array",
            description: "Devices to place on the chart",
            items: {
              type: "object",
              properties: {
                deviceId: { type: "string", description: "UUID of the device (from list_devices)" },
                x: { type: "number", description: "X position (canvas ~1500px wide, space devices ≥200px apart)" },
                y: { type: "number", description: "Y position (canvas ~1000px tall, space devices ≥150px apart)" },
              },
              required: ["deviceId", "x", "y"],
            },
          },
        },
        required: ["name", "description", "devices"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_chart",
      description:
        "Update a chart's name or description. Requires the user to have edit permission on that chart. If the user only has read access, this will fail — tell them they need edit permission.",
      parameters: {
        type: "object",
        properties: {
          chartId: { type: "string", description: "UUID of the chart to update" },
          name: { type: "string", description: "New chart name (optional)" },
          description: { type: "string", description: "New chart description (optional)" },
        },
        required: ["chartId"],
      },
    },
  },
];

const SYSTEM_PROMPT_BASE = `You are an AI assistant for EasyCharts, a network diagram tool.

EasyCharts allows users to create and manage network topology diagrams. Charts contain:
- **Devices**: Network equipment (servers, routers, switches, firewalls, etc.) placed at x,y positions on the canvas
- **Ports**: Network interfaces on devices (e.g., eth0, fa0/0) used to create connections
- **Lines**: Cable/connection types used between devices
- **Bonds**: Grouped connections between device ports

Canvas dimensions: approximately 1500px wide × 1000px tall.
When placing devices, use good spacing (at least 200px apart horizontally, 150px vertically).
Arrange devices logically — e.g., core routers at the top, servers at the bottom.

## Per-chart privileges
Each chart has per-user privileges: canEdit, canDelete, canShare.
- list_charts returns these privileges for every chart.
- get_chart works for any chart the user can access (owned or shared).
- update_chart requires canEdit=true. If the user only has read access, politely explain they do not have edit permission and cannot modify that chart via AI or manually.

When a user asks to modify a chart they only have read access to, do NOT attempt the update. Explain the situation and suggest they ask the chart owner to grant them edit access.

When creating charts:
1. Call list_devices to see available devices
2. Choose appropriate devices and place them at sensible positions
3. After creation, the chart opens in the editor so the user can add connections manually

Be concise and helpful.`;

const PERMISSION_LABELS: Record<Permission, string> = {
  [Permission.CHART_CREATE]: "create new charts",
  [Permission.CHART_UPDATE]: "update/rename charts",
  [Permission.CHART_DELETE]: "delete charts",
  [Permission.CHART_READ]: "read/view charts",
  [Permission.CHART_SHARE]: "share charts with others",
  [Permission.ASSET_EDIT]: "edit assets (devices, lines, etc.)",
  [Permission.ASSET_DELETE]: "delete assets",
  [Permission.ASSET_CREATE]: "create new assets",
  [Permission.ASSET_READ]: "read/view assets",
  [Permission.USER_MANAGE]: "manage users",
  [Permission.APP_SETTINGS]: "modify application settings",
};

function buildPermissionsSection(permissions: Permission[]): string {
  const permSet = new Set(permissions);
  const allPerms = Object.values(Permission);

  const allowed = allPerms.filter((p) => permSet.has(p));
  const denied = allPerms.filter((p) => !permSet.has(p));

  const lines: string[] = ["\n## Your global permissions"];

  if (allowed.length > 0) {
    lines.push("You CAN:");
    for (const p of allowed) lines.push(`  - ${PERMISSION_LABELS[p]}`);
  }

  if (denied.length > 0) {
    lines.push("You CANNOT:");
    for (const p of denied) lines.push(`  - ${PERMISSION_LABELS[p]}`);
  }

  lines.push(
    "\nEnforce these limits strictly. If the user asks you to do something they lack permission for, " +
    "explain the missing permission and do NOT call the corresponding tool.",
  );

  return lines.join("\n");
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly appConfigService: AppConfigService,
    private readonly usersService: UsersService,
    private readonly chartsService: ChartsService,
    private readonly devicesService: DevicesService,
  ) {}

  isEnabled(): boolean {
    return this.appConfigService.getConfig().ai.enabled;
  }

  private buildClient(): OpenAI {
    const { ollamaUrl } = this.appConfigService.getConfig().ai;
    return new OpenAI({
      baseURL: `${ollamaUrl}/v1`,
      apiKey: "ollama", // Ollama does not require a real key
    });
  }

  /**
   * Returns the user's ChartMetadata (including myPrivileges) for a specific chart,
   * or null if the user has no access to it.
   * Uses getAllUserChartsMetadata as the single source of truth for access + privileges.
   */
  private async getChartPrivileges(
    userId: string,
    chartId: string,
  ): Promise<ChartMetadata | null> {
    const all = await this.chartsService.getAllUserChartsMetadata(userId);
    return all.find((c) => c.id === chartId) ?? null;
  }

  async chat(
    userId: string,
    inputMessages: ChatMessage[],
    currentChartId?: string,
    editorEditMode?: boolean,
    currentPage?: CurrentPage,
  ): Promise<ChatResponse> {
    if (!this.isEnabled()) {
      throw new ServiceUnavailableException("AI chat is disabled");
    }

    const { model } = this.appConfigService.getConfig().ai;
    const client = this.buildClient();

    const user = await this.usersService.getUserById(userId);
    const userPermissions = (user.permissions ?? []) as Permission[];

    let chartAction: ChatResponse["chartAction"] | undefined;

    let pageContext = "";
    if (currentChartId) {
      pageContext = editorEditMode
        ? `\n\nThe user has chart ID "${currentChartId}" open in EDIT MODE. You can answer questions about it AND modify it using update_chart.`
        : `\n\nThe user has chart ID "${currentChartId}" open in VIEW MODE (read-only). Answer questions about it but do NOT call update_chart for this chart. If the user asks you to change it, tell them to enable Edit Mode in the editor toolbar first.`;
    } else if (currentPage === "assets") {
      pageContext = "\n\nThe user is on the Assets page. Their questions are likely about assets — device types, ports, line/cable types, or what equipment is available in the system.";
    } else if (currentPage === "users") {
      pageContext = "\n\nThe user is on the User Management page. Their questions are likely about users, roles, or permissions in EasyCharts.";
    } else {
      pageContext = "\n\nThe user is on the main Charts page. Their questions are likely global — about charts they own or have access to, or they want to create a new chart.";
    }

    const systemMessage: ChatCompletionMessageParam = {
      role: "system",
      content: SYSTEM_PROMPT_BASE + buildPermissionsSection(userPermissions) + pageContext,
    };

    const messages: ChatCompletionMessageParam[] = [
      systemMessage,
      ...inputMessages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ];

    // Agentic loop — max 10 iterations as safety valve
    for (let iteration = 0; iteration < 10; iteration++) {
      const response = await client.chat.completions.create({
        model,
        messages,
        tools: TOOLS,
        tool_choice: "auto",
      });

      const choice = response.choices[0];
      if (!choice) break;

      const assistantMessage = choice.message;
      messages.push(assistantMessage as ChatCompletionMessageParam);

      if (
        choice.finish_reason === "stop" ||
        choice.finish_reason === "end" ||
        !assistantMessage.tool_calls?.length
      ) {
        return { message: assistantMessage.content ?? "", chartAction };
      }

      const toolResults: ChatCompletionMessageParam[] = [];

      for (const toolCall of assistantMessage.tool_calls ?? []) {
        let resultData: unknown;
        try {
          resultData = await this.executeTool(
            toolCall.function.name,
            JSON.parse(toolCall.function.arguments || "{}"),
            userId,
            { currentChartId, editorEditMode, permissions: userPermissions },
          );

          // Track chart actions so the frontend can auto-open the editor
          if (
            resultData &&
            typeof resultData === "object" &&
            "chartId" in resultData
          ) {
            const r = resultData as { chartId: string; chartName: string; actionType?: "create" | "edit" };
            chartAction = {
              type: r.actionType ?? "create",
              chartId: r.chartId,
              chartName: r.chartName,
            };
          }
        } catch (err) {
          this.logger.error(`Tool "${toolCall.function.name}" failed`, err);
          // Return the error message to the model so it can explain to the user
          resultData = { error: (err as Error).message };
        }

        toolResults.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(resultData),
        });
      }

      messages.push(...toolResults);
    }

    return {
      message: "I ran into an issue completing your request. Please try again.",
      chartAction,
    };
  }

  private async executeTool(
    name: string,
    args: Record<string, unknown>,
    userId: string,
    context: { currentChartId?: string; editorEditMode?: boolean; permissions?: Permission[] } = {},
  ): Promise<unknown> {
    const permissions = new Set(context.permissions ?? []);
    switch (name) {
      case "list_charts": {
        const charts = await this.chartsService.getAllUserChartsMetadata(userId);
        return charts.map((c) => ({
          id: c.id,
          name: c.name,
          description: c.description,
          createdAt: c.createdAt,
          // Surface privileges so the model knows what it can do per chart
          canEdit: c.myPrivileges?.canEdit ?? true, // owner always can edit
          canDelete: c.myPrivileges?.canDelete ?? true,
        }));
      }

      case "get_chart": {
        const chartId = args.chartId as string;

        // Access check — only charts the user owns or has been shared with
        const meta = await this.getChartPrivileges(userId, chartId);
        if (!meta) {
          throw new ForbiddenException(
            `You do not have access to chart ${chartId}.`,
          );
        }

        const chart = await this.chartsService.getChartById(chartId);
        return {
          id: chart.id,
          name: chart.name,
          description: chart.description,
          canEdit: meta.myPrivileges?.canEdit ?? true,
          deviceCount: chart.devicesOnChart.length,
          lineCount: chart.linesOnChart.length,
          devices: chart.devicesOnChart.map((d) => ({
            name: d.device.name,
            type: d.device.type?.name,
            position: d.position,
            ports: d.device.ports.map((p) => ({ id: p.id, name: p.name })),
          })),
        };
      }

      case "list_devices": {
        const devices = await this.devicesService.getAllDevices();
        return devices.map((d) => ({
          id: d.id,
          name: d.name,
          type: d.type?.name,
          vendor: d.vendor?.name,
          model: d.model?.name,
          portCount: d.ports.length,
          ports: d.ports.map((p) => ({ id: p.id, name: p.name })),
        }));
      }

      case "create_chart": {
        if (!permissions.has(Permission.CHART_CREATE)) {
          throw new ForbiddenException("You do not have permission to create charts.");
        }

        const { name, description, devices } = args as {
          name: string;
          description: string;
          devices: Array<{ deviceId: string; x: number; y: number }>;
        };

        const deviceObjects = await Promise.all(
          devices.map((d) => this.devicesService.getDeviceById(d.deviceId)),
        );

        const dto = {
          name,
          description,
          devicesOnChart: devices.map((d, i) => ({
            chartId: "", // ignored by createChart — ID is assigned by DB
            device: deviceObjects[i],
            position: { x: d.x, y: d.y },
            handles: { left: [], right: [], top: [], bottom: [] },
          })),
          linesOnChart: [],
          bondsOnChart: [],
          notesOnChart: [],
          zonesOnChart: [],
          overlayElementsOnChart: [],
          overlayEdgesOnChart: [],
        };

        const created = await this.chartsService.createChart(
          dto as Parameters<typeof this.chartsService.createChart>[0],
          userId,
        );
        return { chartId: created.id, chartName: created.name, actionType: "create" };
      }

      case "update_chart": {
        if (!permissions.has(Permission.CHART_UPDATE)) {
          throw new ForbiddenException("You do not have permission to update charts.");
        }

        const chartId = args.chartId as string;

        // If this is the chart open in the editor and it's in view mode, block the update
        if (context.currentChartId === chartId && context.editorEditMode === false) {
          throw new ForbiddenException(
            `The chart editor is in view mode. Enable Edit Mode in the editor toolbar before asking me to make changes.`,
          );
        }

        // Privilege check — require canEdit
        const meta = await this.getChartPrivileges(userId, chartId);
        if (!meta) {
          throw new ForbiddenException(
            `You do not have access to chart ${chartId}.`,
          );
        }
        // myPrivileges is undefined only for the owner (who always has full access)
        if (meta.myPrivileges && !meta.myPrivileges.canEdit) {
          throw new ForbiddenException(
            `You have read-only access to "${meta.name}". Ask the chart owner to grant you edit permission.`,
          );
        }

        const updateDto: Record<string, string> = {};
        if (typeof args.name === "string") updateDto.name = args.name;
        if (typeof args.description === "string") updateDto.description = args.description;

        if (Object.keys(updateDto).length === 0) {
          return { success: false, error: "No fields to update were provided." };
        }

        const updated = await this.chartsService.updateChart(
          chartId,
          updateDto as Parameters<typeof this.chartsService.updateChart>[1],
          userId,
        );
        return { chartId: updated.id, chartName: updated.name, actionType: "edit" };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }
}
