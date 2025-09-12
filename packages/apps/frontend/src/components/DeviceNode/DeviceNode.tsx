import {
  PortTypeValues,
  type HandleInfo,
  type Port,
  type PortType,
  type Side,
} from "@easy-charts/easycharts-types";
import AddIcon from "@mui/icons-material/Add";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import { useLayoutEffect, useMemo, useState } from "react";
import type { NodeProps } from "reactflow";
import { Handle, Position, useUpdateNodeInternals } from "reactflow";
import { v4 as uuidv4 } from "uuid";
import type { DeviceNodeData } from "./interfaces/deviceModes.interfaces";
import { useThemeMode } from "../../contexts/ThemeModeContext";
import type { SidesOffset } from "./interfaces/sidesOffset.interface";
import { InlineEditor } from "./InlineEditor";

function initials(text?: string) {
  if (!text) return "Unknow";
  const parts = text.trim().split(" ");
  const a = parts[0]?.[0] ?? "";
  const b = parts[1]?.[0] ?? "";
  return (a + b || a).toUpperCase();
}
export default function DeviceNode({
  data,
  selected,
}: NodeProps<DeviceNodeData>) {
  const { deviceOnChart, editMode, updateDeviceOnChart,onRemoveNode,onHandleContextMenu } = data;
  const { device, handles } = deviceOnChart;
  const { id: deviceId, name, ipAddress, model } = device;
  const { name: modelName, iconUrl, vendor } = model;
  const { name: vendorName } = vendor ?? {};

  const { isDark } = useThemeMode();

  const [pendingSide, setPendingSide] = useState<Side | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const updateInternals = useUpdateNodeInternals();

  const portTypeOptions: string[] = Object.values(PortTypeValues) ?? [];

  const [selectedPortId, setSelectedPortId] = useState<string>("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newPortName, setNewPortName] = useState("");
  const [newPortType, setNewPortType] = useState<string>(
    portTypeOptions[0] ?? ""
  );
  const [newPort, setNewPort] = useState<Port | null>(null);

  function spread(count: number, pad = 10) {
    if (count <= 0) return [];
    if (count === 1) return [50];
    const usable = 100 - pad * 2;
    return Array.from(
      { length: count },
      (_, i) => pad + (i * usable) / (count - 1)
    );
  }
  const nextOffsetForSide = (side: Side) : SidesOffset=> {
    if (side === "left")
      return { axis: "y", value: spread(handles.left.length + 1).at(-1) ?? 0 };
    if (side === "right")
      return { axis: "y", value: spread(handles.right.length + 1).at(-1) ?? 0 };
    if (side === "top")
      return { axis: "x", value: spread(handles.top.length + 1).at(-1) ?? 0 };
    return { axis: "x", value: spread(handles.bottom.length + 1).at(-1) ?? 0 }; // bottom
  };

  const defaultPortValues: Port = {
    id: uuidv4(),
    name: "",
    type: "rj45",
    deviceId,
    inUse: false,
  };

  const leftYs = useMemo(() => spread(handles.left.length), [handles.left]);
  const rightYs = useMemo(() => spread(handles.right.length), [handles.right]);
  const topXs = useMemo(() => spread(handles.top.length), [handles.top]);
  const bottomXs = useMemo(
    () => spread(handles.bottom.length),
    [handles.bottom]
  );

  const portsInUseIds = useMemo(() => {
    const list: HandleInfo[] = [
      ...(deviceOnChart.handles.left ?? []),
      ...(deviceOnChart.handles.right ?? []),
      ...(deviceOnChart.handles.top ?? []),
      ...(deviceOnChart.handles.bottom ?? []),
    ];
    return new Set(list.map((h) => h.port.id));
  }, [
    deviceOnChart.handles.left,
    deviceOnChart.handles.right,
    deviceOnChart.handles.top,
    deviceOnChart.handles.bottom,
  ]);

  useLayoutEffect(() => {
    updateInternals(deviceId);
  }, [deviceId, editMode, deviceOnChart, updateDeviceOnChart, updateInternals]);

  const onAddHandle = (side: Side) => {
    if (isEditorOpen) return;
    setIsEditorOpen(true);
    const port: Port = { ...defaultPortValues, id: uuidv4() };
    setNewPort(port);
    const newHandle: HandleInfo = { port };
    updateDeviceOnChart({
      ...deviceOnChart,
      handles: {
        ...handles,
        [side]: [...(handles[side] ?? []), newHandle],
      },
    });
    setPendingSide(side);
  };

  const addPortToHandle = async (side: Side, port: Port) => {
    updateDeviceOnChart({
      ...deviceOnChart,
      handles: {
        ...handles,
        [side]: handles[side].slice(0, -1).concat({ port }),
      },
    });
    setIsEditorOpen(false);
    updateInternals(deviceId);
  };

  const cancelInlineEditor = () => {
    if (!pendingSide) return;
    setIsEditorOpen(false);
    updateDeviceOnChart({
      ...deviceOnChart,
      handles: {
        ...handles,
        [pendingSide]: (handles[pendingSide] ?? []).slice(0, -1),
      },
    });
    setPendingSide(null);
  };

  const onInlineEditorPlusClick = (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    e.stopPropagation();
    setNewPort({ ...defaultPortValues, id: uuidv4() });
    setCreateDialogOpen(true);
  };

  const onInlineEditorCheckClick = (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    e.stopPropagation();
    if (!pendingSide || !selectedPortId) return;

    const port: Port = device.ports.find((p) => p.id === selectedPortId)!;
    addPortToHandle(pendingSide, port);

    setPendingSide(null);
    setSelectedPortId("");
  };

  const onCreatePort = () => {
    if (!pendingSide) return;
    if (!newPort) return;

    const portToUse: Port = {
      ...newPort,
      name: newPortName,
      type: newPortType as PortType,
    };
    updateDeviceOnChart({
      ...deviceOnChart,
      device: { ...device, ports: [...device.ports, portToUse] },
    });
    setNewPort(null);
    setCreateDialogOpen(false);
  };

  const onDialogCreateButtonClick = async () => {
    onCreatePort();
    setCreateDialogOpen(false);
    setNewPortName("");
  };

  return (
    <div
      className={[
        "relative w-[220px] rounded-2xl border shadow-sm",
        isDark
          ? "bg-slate-900 border-slate-700 text-slate-100"
          : "bg-white border-slate-200 text-slate-900",
        selected
          ? [
              "ring-2 ring-indigo-400 ring-offset-2",
              isDark ? "ring-offset-slate-900" : "ring-offset-white",
            ].join(" ")
          : "",
      ].join(" ")}
    >
      {editMode && selected && (
        <IconButton
          aria-label="Remove device"
          size="small"
          onMouseDown={(e) => e.stopPropagation()} // avoid drag/select
          onClick={(e) => {
            e.stopPropagation();
            onRemoveNode(deviceId);
          }}
          className="!absolute right-1 top-1 z-20"
          disableRipple
          disableFocusRipple
          sx={{
            p: 0.25,
            bgcolor: "transparent",
            "&:hover": { bgcolor: "transparent" },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      )}

      {/* Header: device name */}
      <div
        className={[
          "px-3 pt-2 pb-1 border-b",
          isDark ? "border-slate-700" : "border-slate-100",
        ].join(" ")}
      >
        <div className="text-sm font-semibold truncate">{name ?? "Device"}</div>
      </div>

      {/* Body */}
      <div className="p-3 space-y-3">
        <div className="flex items-center gap-2">
          {iconUrl ? (
            <div className="h-8 w-8 rounded-lg bg-slate-200 flex items-center justify-center text-xs font-bold">
              <img
                src={iconUrl}
                onError={() => ""}
                alt={modelName ? `${modelName} icon` : "Model icon"}
                className="h-8 w-8 rounded-lg object-cover bg-slate-100 border border-slate-200 select-none"
                loading="lazy"
                decoding="async"
                draggable={false}
              />
            </div>
          ) : (
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-200 to-indigo-400 text-indigo-900 flex items-center justify-center text-xs font-bold">
              {initials(name)}
            </div>
          )}
          <div className="min-w-0">
            <div className="text-xs font-medium leading-4 truncate">
              {modelName ?? "Model"}
            </div>
            {vendorName ? (
              <div className="text-[11px] text-slate-500 leading-4 truncate">
                {vendorName}
              </div>
            ) : null}
          </div>
        </div>

        {/* IP row */}
        <div className="text-xs">
          <span className="text-slate-500">IP: </span>
          <span className="font-medium">{ipAddress ?? "—"}</span>
        </div>
      </div>

      {leftYs.map((y, i) => {
        const pid = handles.left?.[i]?.port?.id;
        if (!pid) return null;
        return (
          <>
            <Handle
              key={`${pid}-s`}
              id={pid}
              type="source"
              position={Position.Left}
              style={{ top: `${y}%` }}
              isConnectableEnd={false}
              onContextMenu={(e) =>
                onHandleContextMenu?.(e, {
                  deviceId,
                  portId: pid,
                  role: "source",
                  side: "left",
                })
              }
            />
            <Handle
              key={`${pid}-t`}
              id={pid}
              type="target"
              position={Position.Left}
              style={{ top: `${y}%` }}
              isConnectableStart={false} // can end here, not start here
              onContextMenu={(e) =>
                onHandleContextMenu?.(e, {
                  deviceId,
                  portId: pid,
                  role: "target",
                  side: "left",
                })
              }
            />
          </>
        );
      })}
      {rightYs.map((y, i) => {
        const pid = handles.right?.[i]?.port?.id;
        if (!pid) return null;
        return (
          <>
            <Handle
              key={`${pid}-s`}
              id={pid}
              type="source"
              position={Position.Right}
              style={{ top: `${y}%` }}
              isConnectableEnd={false}
              onContextMenu={(e) =>
                onHandleContextMenu?.(e, {
                  deviceId,
                  portId: pid,
                  role: "source",
                  side: "right",
                })
              }
            />
            <Handle
              key={`${pid}-t`}
              id={pid}
              type="target"
              position={Position.Right}
              style={{ top: `${y}%` }}
              isConnectableStart={false}
              onContextMenu={(e) =>
                onHandleContextMenu?.(e, {
                  deviceId,
                  portId: pid,
                  role: "target",
                  side: "right",
                })
              }
            />
          </>
        );
      })}
      {topXs.map((x, i) => {
        const pid = handles.top?.[i]?.port?.id;
        if (!pid) return null;
        return (
          <>
            <Handle
              key={`${pid}-s`}
              id={pid}
              type="source"
              position={Position.Top}
              style={{ left: `${x}%` }}
              isConnectableEnd={false}
              onContextMenu={(e) =>
                onHandleContextMenu?.(e, {
                  deviceId,
                  portId: pid,
                  role: "source",
                  side: "top",
                })
              }
            />
            <Handle
              key={`${pid}-t`}
              id={pid}
              type="target"
              position={Position.Top}
              style={{ left: `${x}%` }}
              isConnectableStart={false}
              onContextMenu={(e) =>
                onHandleContextMenu?.(e, {
                  deviceId,
                  portId: pid,
                  role: "target",
                  side: "top",
                })
              }
            />
          </>
        );
      })}
      {bottomXs.map((x, i) => {
        const pid = handles.bottom?.[i]?.port?.id;
        if (!pid) return null;
        return (
          <>
            <Handle
              key={`${pid}-s`}
              id={pid}
              type="source"
              position={Position.Bottom}
              style={{ left: `${x}%` }}
              isConnectableEnd={false}
              onContextMenu={(e) =>
                onHandleContextMenu?.(e, {
                  deviceId,
                  portId: pid,
                  role: "source",
                  side: "bottom",
                })
              }
            />
            <Handle
              key={`${pid}-t`}
              id={pid}
              type="target"
              position={Position.Bottom}
              style={{ left: `${x}%` }}
              isConnectableStart={false}
              onContextMenu={(e) =>
                onHandleContextMenu?.(e, {
                  deviceId,
                  portId: pid,
                  role: "target",
                  side: "bottom",
                })
              }
            />
          </>
        );
      })}

      {editMode && isEditorOpen && (
        <InlineEditor
          devicePorts={device.ports}
          cancelInlineEditor={cancelInlineEditor}
          nextOffsetForSide={nextOffsetForSide}
          onInlineEditorCheckClick={onInlineEditorCheckClick}
          onInlineEditorPlusClick={onInlineEditorPlusClick}
          pendingSide={pendingSide}
          portsInUseIds={portsInUseIds}
          selectedPortId={selectedPortId}
          setSelectedPortId={setSelectedPortId}
        />
      )}

      {editMode && selected && (
        <>
          {/* LEFT controls */}
          <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 flex flex-col gap-1">
            <IconButton
              size="small"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onAddHandle("left");
              }}
              disableRipple
              disableFocusRipple
              sx={{
                p: 0.25,
                bgcolor: "transparent",
                "&:hover": { bgcolor: "transparent" },
              }}
            >
              <AddIcon fontSize="small" color="success" />
            </IconButton>
          </div>

          {/* RIGHT controls */}
          <div className="absolute -right-1 top-1/2 -translate-y-1/2 flex flex-col gap-1">
            <IconButton
              size="small"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onAddHandle("right");
              }}
              disableRipple
              disableFocusRipple
              sx={{
                p: 0.25,
                bgcolor: "transparent",
                "&:hover": { bgcolor: "transparent" },
              }}
            >
              <AddIcon fontSize="small" color="success" />
            </IconButton>
          </div>

          {/* TOP controls */}
          <div className="absolute left-1/2 -translate-x-1/2 -top-1 flex gap-1">
            <IconButton
              size="small"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onAddHandle("top");
              }}
              disableRipple
              disableFocusRipple
              sx={{
                p: 0.25,
                bgcolor: "transparent",
                "&:hover": { bgcolor: "transparent" },
              }}
            >
              <AddIcon fontSize="small" color="success" />
            </IconButton>
          </div>

          {/* BOTTOM controls */}
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 flex gap-1">
            <IconButton
              size="small"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onAddHandle("bottom");
              }}
              disableRipple
              disableFocusRipple
              sx={{
                p: 0.25,
                bgcolor: "transparent",
                "&:hover": { bgcolor: "transparent" },
              }}
            >
              <AddIcon fontSize="small" color="success" />
            </IconButton>
          </div>
        </>
      )}

      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Create Port</DialogTitle>
        <DialogContent dividers>
          <div className="flex flex-col gap-3 pt-1">
            <TextField
              label="Name"
              size="small"
              value={newPortName}
              onChange={(e) => setNewPortName(e.target.value)}
              autoFocus
            />
            <FormControl size="small">
              <InputLabel id="port-type-label">Type</InputLabel>
              <Select
                labelId="port-type-label"
                label="Type"
                value={newPortType}
                onChange={(e) => setNewPortType(String(e.target.value))}
              >
                {portTypeOptions.map((t) => (
                  <MenuItem key={t} value={t}>
                    {t}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={onDialogCreateButtonClick}
            disabled={!newPortName.trim() || !newPortType}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
