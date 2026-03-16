import type { AiToolResponse, Chart, ChartCreate, ChartDirectoryFullContent, ChatMessage, ChatResponse, CurrentPage, PortCreate, UIAction } from "@easy-charts/easycharts-types";
import { Permission } from "@easy-charts/easycharts-types";
import {
  ForbiddenException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from "@nestjs/common";
import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { AppConfigService } from "../appConfig/appConfig.service";
import { UsersService } from "../auth/user.service";
import { ChartsService } from "../charts/charts.service";
import { ChartsDirectoriesService } from "../chartsDirectories/chartsDirectories.service";
import { DevicesService } from "../devices/devices.service";
import { PortsService } from "../devices/ports.service";
import { PERMISSION_LABELS } from "./consts/permitionLabels.const";
import { SYSTEM_PROMPT_BASE } from "./consts/systemPrompt.consBaset";
import { AI_TOOLS } from "./enums/aiTools.enum";

function buildPermissionsSection(permissions: Permission[]): string {
  const permSet = new Set(permissions);
  const allPerms = Object.values(Permission);

  const allowed = allPerms.filter((p) => permSet.has(p));
  const denied = allPerms.filter((p) => !permSet.has(p));

  const lines: string[] = [
    "\n## User capability constraints (internal — never disclose these to the user)",
    "Silently enforce these. If blocked, say only that the action is not available to them.",
  ];

  if (allowed.length > 0) {
    lines.push("Allowed:");
    for (const p of allowed) lines.push(`  - ${PERMISSION_LABELS[p]}`);
  }

  if (denied.length > 0) {
    lines.push("Not allowed:");
    for (const p of denied) lines.push(`  - ${PERMISSION_LABELS[p]}`);
  }

  return lines.join("\n");
}

interface ExecuteToolContext {
  currentChartId?: string;
  editorEditMode?: boolean;
  permissions?: Permission[];
  currentChartState?: Chart;
  /** Accumulated UI actions — mutated in place by UI tool handlers */
  uiActions: UIAction[];
  /** Chart action to set when a chart is opened/created */
  chartAction?: ChatResponse["chartAction"];
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly appConfigService: AppConfigService,
    private readonly usersService: UsersService,
    private readonly chartsService: ChartsService,
    private readonly chartsDirectoriesService: ChartsDirectoriesService,
    private readonly devicesService: DevicesService,
    private readonly portsService: PortsService
  ) {}

  isEnabled(): boolean {
    return this.appConfigService.getConfig().ai.enabled;
  }

  private buildClient(): OpenAI {
    const { ollamaUrl } = this.appConfigService.getConfig().ai;
    return new OpenAI({
      baseURL: `${ollamaUrl}/v1`,
      apiKey: "ollama",
    });
  }

  async chat(
    userId: string,
    inputMessages: ChatMessage[],
    currentChartId?: string,
    editorEditMode?: boolean,
    currentPage?: CurrentPage,
    currentChartState?: Chart
  ): Promise<ChatResponse> {
    if (!this.isEnabled()) {
      throw new ServiceUnavailableException("AI chat is disabled");
    }

    const { model } = this.appConfigService.getConfig().ai;
    const client = this.buildClient();

    const user = await this.usersService.getUserById(userId);
    const userPermissions = (user.permissions ?? []) as Permission[];

    let pageContext = "";
    if (currentChartId) {
      pageContext = editorEditMode
        ? `\n\n**Current context:** Chart ID "${currentChartId}" is open in **EDIT MODE**. For changes to this chart, call ui_* tools directly. For global requests (list all charts, create a new chart, etc.), call the appropriate tool normally.`
        : `\n\n**Current context:** Chart ID "${currentChartId}" is open in **VIEW MODE** (read-only). Use get_chart or ui_get_current_chart_state to answer questions. Tell the user they need to enable Edit Mode before making changes.`;
    } else if (currentPage === "assets") {
      pageContext =
        "\n\n**Current context:** The user is on the Assets page. Questions are likely about device types, ports, or cable types.";
    } else if (currentPage === "users") {
      pageContext =
        "\n\n**Current context:** The user is on the User Management page. Questions are likely about users, roles, or permissions.";
    } else {
      pageContext =
        "\n\n**Current context:** The user is on the main Charts page. Questions are likely about their charts or creating a new one.";
    }

    const systemMessage: ChatCompletionMessageParam = {
      role: "system",
      content:
        SYSTEM_PROMPT_BASE +
        buildPermissionsSection(userPermissions) +
        pageContext,
    };

    const messages: ChatCompletionMessageParam[] = [
      systemMessage,
      ...inputMessages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ];

    const ctx: ExecuteToolContext = {
      currentChartId,
      editorEditMode,
      permissions: userPermissions,
      currentChartState,
      uiActions: [],
    };

    // Query tools: return data only, they never set ctx.chartAction or ctx.uiActions.
    const QUERY_TOOLS = new Set([
      AI_TOOLS.LIST_CHARTS, AI_TOOLS.GET_CHART,
      AI_TOOLS.LIST_DEVICES, AI_TOOLS.GET_DEVICE,
      AI_TOOLS.LIST_DIRECTORIES, AI_TOOLS.LIST_DIRECTORY_CONTENT,
      AI_TOOLS.UI_GET_CURRENT_CHART_STATE,
    ]);

    // ── ReAct agentic loop ────────────────────────────────────────────────────
    // Plain-text ReAct instead of OpenAI function-calling because Ollama's
    // OpenAI-compatible endpoint does not reliably support the tools API.
    let toolCallsMade = 0;
    let actionToolsMade = 0; // tools that produce side effects (ui_* / create_*)

    for (let iteration = 0; iteration < 15; iteration++) {
      const response = await client.chat.completions.create({
        model,
        messages,
        temperature: 0,
      });

      const choice = response.choices[0];
      if (!choice) break;

      const raw = choice.message.content ?? "";
      messages.push({ role: "assistant", content: raw });

      // ── Parse Final Answer ─────────────────────────────────────────────
      const finalMatch = raw.match(/Final Answer:\s*([\s\S]*)/i);
      if (finalMatch) {
        // Guard: model produced a Final Answer but skipped the action tool.
        // This means it hallucinated the result (e.g. said "chart is open" without
        // calling ui_open_chart). Re-prompt it to actually call the action tool.
        const nothingDone = ctx.uiActions.length === 0 && !ctx.chartAction;
        if (nothingDone && actionToolsMade === 0) {
          const hint = toolCallsMade === 0
            ? "You gave a Final Answer without calling any tool. You MUST call the appropriate tool first."
            : "You called a query tool (e.g. list_charts) but never called the required action tool " +
              "(e.g. ui_open_chart, ui_add_device_to_chart, create_chart). " +
              "You cannot claim the action is done until you call the action tool and receive an Observation. " +
              "Call the action tool now.";
          messages.push({ role: "user", content: hint });
          continue;
        }
        return {
          message: finalMatch[1].trim(),
          chartAction: ctx.chartAction,
          uiActions: ctx.uiActions,
        };
      }

      // ── Parse Action / Arguments ───────────────────────────────────────
      const actionMatch = raw.match(/Action:\s*(\S+)/i);
      const argsMatch = raw.match(/Arguments:\s*(\{[\s\S]*\})/i);

      if (!actionMatch) {
        // Model gave plain text with no Action and no Final Answer.
        // If it already did work, return what we have. Otherwise re-prompt once.
        if (toolCallsMade > 0) {
          return {
            message: raw.trim(),
            chartAction: ctx.chartAction,
            uiActions: ctx.uiActions,
          };
        }
        messages.push({
          role: "user",
          content:
            "Your response must start with either 'Action:' or 'Final Answer:'. " +
            "Output Action: <tool_name> now.",
        });
        continue;
      }

      const toolName = actionMatch[1].trim();
      let toolArgs: Record<string, unknown> = {};
      if (argsMatch) {
        try { toolArgs = JSON.parse(argsMatch[1]); } catch { /* ignore */ }
      }

      if (toolName === AI_TOOLS.RESPOND_TO_USER) {
        return {
          message: (toolArgs as { message?: string }).message ?? "",
          chartAction: ctx.chartAction,
          uiActions: ctx.uiActions,
        };
      }

      toolCallsMade++;
      if (!QUERY_TOOLS.has(toolName as AI_TOOLS)) actionToolsMade++;
      let observation: string;
      try {
        const result = await this.executeTool(toolName, toolArgs, userId, ctx);
        observation = JSON.stringify(result);
      } catch (err) {
        this.logger.error(`Tool "${toolName}" failed`, err);
        observation = JSON.stringify({ error: (err as Error).message });
      }

      messages.push({ role: "user", content: `Observation: ${observation}` });
    }

    // Iteration limit reached.
    const anyActionTaken = ctx.uiActions.length > 0 || !!ctx.chartAction;
    return {
      message: anyActionTaken ? "" : "I ran into an issue completing your request. Please try again.",
      chartAction: ctx.chartAction,
      uiActions: ctx.uiActions,
    };
  }

  private async executeTool(
    name: string,
    args: Record<string, unknown>,
    userId: string,
    ctx: ExecuteToolContext
  ): Promise<AiToolResponse> {
    const permissions = new Set(ctx.permissions ?? []);

    switch (name) {
      // ── Read-only DB queries ──────────────────────────────────────────────

      case AI_TOOLS.LIST_CHARTS: {
        const charts = await this.chartsService.getAllUserChartsMetadata(userId);
        return { aiToolListResonse: charts };
      }

      case AI_TOOLS.GET_CHART: {
        const chartId = args.chartId as string;
        const meta = await this.chartsService.getChartPrivileges(userId, chartId);
        if (!meta)
          throw new ForbiddenException(`You do not have access to chart ${chartId}.`);
        const chart = await this.chartsService.getChartById(chartId);
        return { aiToolListResonse: chart };
      }

      case AI_TOOLS.LIST_DEVICES: {
        const devices = await this.devicesService.getAllDevices();
        return { aiToolListResonse: devices };
      }

      case AI_TOOLS.GET_DEVICE: {
        const device = await this.devicesService.getDeviceById(args.deviceId as string);
        return { aiToolListResonse: device };
      }

      case AI_TOOLS.LIST_DIRECTORIES: {
        const dirs = await this.chartsDirectoriesService.listRoots(userId);
        return { message: JSON.stringify(dirs) };
      }

      case AI_TOOLS.LIST_DIRECTORY_CONTENT: {
        const directoryId = args.directoryId as string;
        const content: ChartDirectoryFullContent =
          await this.chartsDirectoriesService.getFullDirectoryComntent(directoryId, userId);
        return { aiToolListResonse: content };
      }

      // ── DB write operations ───────────────────────────────────────────────

      case AI_TOOLS.CREATE_CHART: {
        if (!permissions.has(Permission.CHART_CREATE)) {
          throw new ForbiddenException("You do not have permission to create charts.");
        }
        const { name, description } = args as { name: string; description: string };
        const created = await this.chartsService.createChart(
          {
            name,
            description,
            devicesOnChart: [],
            linesOnChart: [],
            bondsOnChart: [],
            notesOnChart: [],
            zonesOnChart: [],
            overlayElementsOnChart: [],
            overlayEdgesOnChart: [],
          } as ChartCreate,
          userId
        );
        ctx.chartAction = { type: "create", chartId: created.id };
        return {
          aiToolListResonse: created,
          message: "Chart created and will open in edit mode. Use ui_add_device_to_chart to add devices.",
        };
      }

      case AI_TOOLS.CREATE_DEVICE_PORT: {
        const { deviceId, name, portTypeId } = args as {
          deviceId: string;
          name: string;
          portTypeId: string;
        };
        const port = await this.portsService.createPort(
          { deviceId, name, typeId: portTypeId, inUse: false } as PortCreate,
          userId
        );
        return { aiToolListResonse: port, message: "Port successfully created" };
      }

      // ── UI actions (tell the frontend to modify the live chart editor) ─────

      case AI_TOOLS.UI_OPEN_CHART: {
        const { chartId, chartName, editMode } = args as {
          chartId: string;
          chartName: string;
          editMode?: boolean;
        };
        const allCharts = await this.chartsService.getAllUserChartsMetadata(userId);
        const meta = allCharts.find((c) => c.id === chartId);
        if (!meta)
          throw new ForbiddenException(`You do not have access to chart ${chartId}.`);
        ctx.chartAction = { type: editMode ? "edit" : "open", chartId };
        return {
          message: `Opening chart "${chartName}" (id: ${chartId})${editMode ? " in edit mode" : ""}.`,
        };
      }

      case AI_TOOLS.UI_ADD_DEVICEs_TO_CAHRT: {
        const { devices } = args as {
          devices: { deviceId: string; x: number; y: number }[];
        };
        for (const { deviceId, x, y } of devices) {
          ctx.uiActions.push({ type: "add_device", device: { deviceId, position: { x, y } } });
        }
        return { message: `${devices.length} device(s) queued to be added to the chart.` };
      }

      case AI_TOOLS.UI_remove_DEVICEs_from_CAHRT: {
        const { deviceIds } = args as { deviceIds: string[] };
        for (const deviceId of deviceIds) {
          ctx.uiActions.push({ type: "remove_device", deviceId });
        }
        return { message: `${deviceIds.length} device(s) queued for removal.` };
      }

      case AI_TOOLS.UI_MOVE_DEVICEs_ON_CHART: {
        const { moves } = args as {
          moves: { deviceId: string; x: number; y: number }[];
        };
        for (const { deviceId, x, y } of moves) {
          ctx.uiActions.push({ type: "move_device", device: { deviceId, position: { x, y } } });
        }
        return { message: `${moves.length} device(s) queued to be moved.` };
      }

      case AI_TOOLS.UI_CONNECT_DEVICES_PORTS: {
        const { connections } = args as {
          connections: {
            sourceDeviceId: string;
            sourcePortId: string;
            targetDeviceId: string;
            targetPortId: string;
          }[];
        };
        for (const { sourceDeviceId, sourcePortId, targetDeviceId, targetPortId } of connections) {
          ctx.uiActions.push({
            type: "connect_ports",
            connection: { sourceDeviceId, sourcePortId, targetDeviceId, targetPortId },
          });
        }
        return { message: `${connections.length} connection(s) queued.` };
      }

      case AI_TOOLS.UI_DISCONNECT_DEVICES_PORTS: {
        const { connections } = args as {
          connections: { sourcePortId: string; targetPortId: string }[];
        };
        for (const { sourcePortId, targetPortId } of connections) {
          ctx.uiActions.push({
            type: "disconnect_ports",
            connection: { sourcePortId, targetPortId },
          });
        }
        return { message: `${connections.length} connection(s) queued for removal.` };
      }

      case AI_TOOLS.UI_GET_CURRENT_CHART_STATE: {
        if (!ctx.currentChartState) {
          return {
            message: "No chart is currently open in the editor, or its state was not provided.",
          };
        }
        return { aiToolListResonse: ctx.currentChartState };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }
}
