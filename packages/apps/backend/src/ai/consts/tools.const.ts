import { ChatCompletionTool } from "openai/resources/index.js";
import { AI_TOOLS } from "../enums/aiTools.enum";

export const TOOLS: ChatCompletionTool[] = [
  // ── Read-only DB queries ───────────────────────────────────────────────────
  {
    type: "function",
    function: {
      name: AI_TOOLS.LIST_CHARTS,
      description:
        "List all charts the current user has access to (owned + shared). Returns chart id, name, description, and the user's privileges on each chart.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: AI_TOOLS.GET_CHART,
      description:
        "Get the full details of a specific chart: devices on it (with device IDs, port IDs), positions, and connections. Call this before making UI edits so you know what's already there.",
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
      name: AI_TOOLS.LIST_DEVICES,
      description:
        "List all available device types (servers, routers, switches, etc.) that can be placed on a chart. Always call this before adding devices.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: AI_TOOLS.GET_DEVICE,
      description: "Get full details of a specific device including all its ports.",
      parameters: {
        type: "object",
        properties: {
          deviceId: { type: "string", description: "UUID of the device to retrieve" },
        },
        required: ["deviceId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: AI_TOOLS.LIST_DIRECTORIES,
      description: "List all available chart directories (root folders) the user can access.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: AI_TOOLS.LIST_DIRECTORY_CONTENT,
      description: "List the contents of a specific directory (sub-directories and charts inside it).",
      parameters: {
        type: "object",
        properties: {
          directoryId: { type: "string", description: "UUID of the directory" },
        },
        required: ["directoryId"],
      },
    },
  },

  // ── DB write operations ────────────────────────────────────────────────────
  {
    type: "function",
    function: {
      name: AI_TOOLS.CREATE_CHART,
      description:
        "Create a new empty chart (name + description only) in the database. After creating it, use ui_add_device_to_chart to add devices to the editor.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Name of the chart" },
          description: { type: "string", description: "Brief description of the chart's purpose" },
        },
        required: ["name", "description"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: AI_TOOLS.CREATE_DEVICE_PORT,
      description: "Create a new port on a specific device. Ask the user for port type and name if not provided.",
      parameters: {
        type: "object",
        properties: {
          deviceId: { type: "string", description: "UUID of the device" },
          name: { type: "string", description: "Port name (e.g. 'eth0', 'GigabitEthernet0/1')" },
          portTypeId: { type: "string", description: "UUID of the port type" },
        },
        required: ["deviceId", "name", "portTypeId"],
      },
    },
  },

  // ── UI actions (tell the frontend to modify the open chart editor) ─────────
  {
    type: "function",
    function: {
      name: AI_TOOLS.UI_OPEN_CHART,
      description:
        "Tell the UI to open a specific chart in the chart editor. Use editMode=true when you intend to make changes afterward.",
      parameters: {
        type: "object",
        properties: {
          chartId: { type: "string", description: "UUID of the chart to open" },
          chartName: { type: "string", description: "Name of the chart (for display)" },
          editMode: { type: "boolean", description: "Whether to open in edit mode (default false)" },
        },
        required: ["chartId", "chartName"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: AI_TOOLS.UI_ADD_DEVICEs_TO_CAHRT,
      description:
        "Tell the UI to add one or more devices to the currently open chart editor. The chart must be open in edit mode. Always call list_devices first to get valid device IDs. Space devices ≥200px apart horizontally, ≥150px vertically on a ~1500×1000px canvas.",
      parameters: {
        type: "object",
        properties: {
          devices: {
            type: "array",
            description: "List of devices to add",
            items: {
              type: "object",
              properties: {
                deviceId: { type: "string", description: "UUID of the device (from list_devices)" },
                x: { type: "number", description: "X position on canvas" },
                y: { type: "number", description: "Y position on canvas" },
              },
              required: ["deviceId", "x", "y"],
            },
          },
        },
        required: ["devices"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: AI_TOOLS.UI_remove_DEVICEs_from_CAHRT,
      description:
        "Tell the UI to remove one or more devices from the currently open chart editor in a single call. Call get_chart first to get device IDs.",
      parameters: {
        type: "object",
        properties: {
          deviceIds: {
            type: "array",
            items: { type: "string" },
            description: "List of device.id (UUIDs) to remove",
          },
        },
        required: ["deviceIds"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: AI_TOOLS.UI_MOVE_DEVICEs_ON_CHART,
      description: "Tell the UI to move one or more devices to new positions on the canvas in a single call.",
      parameters: {
        type: "object",
        properties: {
          moves: {
            type: "array",
            description: "List of move operations",
            items: {
              type: "object",
              properties: {
                deviceId: { type: "string", description: "device.id (UUID) to move" },
                x: { type: "number", description: "New X position" },
                y: { type: "number", description: "New Y position" },
              },
              required: ["deviceId", "x", "y"],
            },
          },
        },
        required: ["moves"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: AI_TOOLS.UI_CONNECT_DEVICES_PORTS,
      description:
        "Tell the UI to connect one or more pairs of device ports with lines in a single call. Ports must be of the same type and not already connected.",
      parameters: {
        type: "object",
        properties: {
          connections: {
            type: "array",
            description: "List of port pairs to connect",
            items: {
              type: "object",
              properties: {
                sourceDeviceId: { type: "string", description: "device.id of the source device" },
                sourcePortId: { type: "string", description: "port.id of the source port" },
                targetDeviceId: { type: "string", description: "device.id of the target device" },
                targetPortId: { type: "string", description: "port.id of the target port" },
              },
              required: ["sourceDeviceId", "sourcePortId", "targetDeviceId", "targetPortId"],
            },
          },
        },
        required: ["connections"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: AI_TOOLS.UI_DISCONNECT_DEVICES_PORTS,
      description: "Tell the UI to remove one or more connections between ports in a single call.",
      parameters: {
        type: "object",
        properties: {
          connections: {
            type: "array",
            description: "List of port pairs to disconnect",
            items: {
              type: "object",
              properties: {
                sourcePortId: { type: "string", description: "port.id of the source port" },
                targetPortId: { type: "string", description: "port.id of the target port" },
              },
              required: ["sourcePortId", "targetPortId"],
            },
          },
        },
        required: ["connections"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: AI_TOOLS.UI_GET_CURRENT_CHART_STATE,
      description:
        "Get the current state of the chart in the editor, including any unsaved changes the user made manually. Use this to understand the live state before adding/removing devices or connections.",
      parameters: { type: "object", properties: {} },
    },
  },
  // ── Final reply ────────────────────────────────────────────────────────────
  {
    type: "function",
    function: {
      name: AI_TOOLS.RESPOND_TO_USER,
      description:
        "Send a final text reply to the user. Call this ONLY when all actions are complete and you want to confirm what was done, or when you need to ask the user a clarifying question. Do NOT call this mid-task.",
      parameters: {
        type: "object",
        properties: {
          message: { type: "string", description: "The message to show the user" },
        },
        required: ["message"],
      },
    },
  },
];
