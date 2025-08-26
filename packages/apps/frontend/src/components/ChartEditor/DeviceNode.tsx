import {
  PortTypeValues,
  type DeviceOnChart,
  type HandleInfo,
  type Port,
  type PortType,
  type Side
} from "@easy-charts/easycharts-types";
import AddIcon from "@mui/icons-material/Add";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import RemoveIcon from "@mui/icons-material/Remove";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, IconButton, InputLabel, MenuItem, Select, TextField } from "@mui/material";
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { NodeProps } from "reactflow";
import { Handle, Position, useUpdateNodeInternals } from "reactflow";
import { v4 as uuidv4 } from "uuid";
import type { DeviceNodeData } from "./interfaces/deviceModes.interfaces";


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
  const { deviceOnChart, editMode,updateDeviceOnChart } = data;
  const { device,handles} = deviceOnChart;
  const { id: deviceId, name, ipAddress, model } = device;
  const { name: modelName, iconUrl, vendor } = model;
  const { name: vendorName } = vendor ?? {};

  const [pendingSide, setPendingSide] = useState<Side | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const updateInternals = useUpdateNodeInternals();

  const portTypeOptions :string[] = Object.values(PortTypeValues) ?? []

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
   const nextOffsetForSide = (side: Side) => {
    if (side === "left")   return { axis: "y", value: spread(handles.left.length + 1).at(-1) ?? 0 };
    if (side === "right")  return { axis: "y", value: spread(handles.right.length + 1).at(-1) ?? 0 };
    if (side === "top")    return { axis: "x", value: spread(handles.top.length + 1).at(-1) ?? 0 };
    return { axis: "x", value: spread(handles.bottom.length + 1).at(-1) ?? 0 }; // bottom
  };

  const defaultPortValues: Port = { id: uuidv4(), name: '', type: 'rj45', deviceId };

  const leftYs   = useMemo(() => spread(handles.left.length),   [handles.left]);
  const rightYs  = useMemo(() => spread(handles.right.length),  [handles.right]);
  const topXs    = useMemo(() => spread(handles.top.length),    [handles.top]);
  const bottomXs = useMemo(() => spread(handles.bottom.length), [handles.bottom]);

const portsInUseIds = useMemo(() => {
  const all: HandleInfo[] = [
    ...(handles.left ?? []),
    ...(handles.right ?? []),
    ...(handles.top ?? []),
    ...(handles.bottom ?? []),
  ];
  console.log("handles",handles,all)
  return new Set(all.map(h => h?.port?.id));
}, [handles]);


  useLayoutEffect(() => {
    updateInternals(deviceId);
  }, [deviceId,editMode, deviceOnChart, updateInternals]);

  useLayoutEffect(() => {
    for (const side in handles) {
      for (const handle of handles[side as Side]) {
        if (!handle.port.inUse && selected) handle.direction = "source";
        else if (!handle.port.inUse && !selected) handle.direction = "target";
      }
    }

    updateDeviceOnChart({
      ...deviceOnChart,
      handles,
    });
  }, [selected]);

  const onAddHandle =  (side: Side) => {
    if (isEditorOpen) return;
    setIsEditorOpen(true);
   const port : Port = {...defaultPortValues, id: uuidv4()};
    setNewPort(port);
    const newHandle: HandleInfo = { port, direction: "source" };
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
        [side]: [...(handles[side] ?? []).slice(0, -1), { port, direction: 'source' } as HandleInfo],
      },
    });
    setIsEditorOpen(false);
  };
  const onRemoveHandle = (side:Side) => {
    // TODO: implement remove handle for `side`
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

  const onInlineEditorPlusClick  = (e:React.MouseEvent<HTMLButtonElement, MouseEvent>) =>{
    e.stopPropagation();
    setNewPort({...defaultPortValues, id: uuidv4()});
    setCreateDialogOpen(true);
  }

  const onInlineEditorCheckClick = (e:React.MouseEvent<HTMLButtonElement, MouseEvent>) =>{
    e.stopPropagation();
    if (!pendingSide || !selectedPortId) return;

    const port:Port = device.ports.find(p=>p.id===selectedPortId)!
    addPortToHandle(pendingSide, port); 

    setPendingSide(null);
    setSelectedPortId("");
  }

  const onCreatePort = () => {
    if (!pendingSide) return;
    if (!newPort) return;

    const portToUse: Port = { ...newPort, name: newPortName, type: newPortType as PortType };
    updateDeviceOnChart({
      ...deviceOnChart,
      device: { ...device, ports: [...device.ports, portToUse] }
    })
    setNewPort(null);
    setCreateDialogOpen(false);
  };

  const onDialogCreateButtonClick = async  () =>{
    onCreatePort();
    setCreateDialogOpen(false);
    setNewPortName("");
  }

  const inlineEditor = (() => {
  if (!pendingSide) return null;
  const { value } = nextOffsetForSide(pendingSide);
  const common =
    "absolute z-10 flex items-center gap-2 bg-white/90 backdrop-blur px-2 py-1 rounded-md border border-slate-200 shadow";

  const iconBtn =
    "inline-flex items-center justify-center w-7 h-7 rounded-md border border-slate-300 " +
    "bg-white shadow hover:bg-slate-50 focus:outline-none";

  const SelectEl = (
    <select
      value={selectedPortId}
      onChange={(e) => setSelectedPortId(e.target.value)}
      className="h-8 min-w-[160px] rounded-md border border-slate-300 bg-white px-2 text-xs shadow focus:outline-none focus:ring"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <option value="" disabled>
        Choose a port…
      </option>
      
      {/* show only ports not already in use */}
      {device.ports.filter(p => !portsInUseIds.has(p.id)).map(p => (
        <option key={p.id} value={p.id}>
          {p.name} ({p.type})
        </option>
      ))}
    </select>
  );

  const AddPortBtn = (
    <button
      type="button"
      className={iconBtn}
      title="Create new port"
      onClick={(e) => onInlineEditorPlusClick(e)}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <AddIcon htmlColor="#2563eb" fontSize="small" />
    </button>
  );

  const ConfirmBtn = (
    <button
      type="button"
      className={iconBtn}
      disabled={!selectedPortId}
      onClick={(e) => {onInlineEditorCheckClick(e)}}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <CheckIcon fontSize="small" />
    </button>
  );

  const CancelBtn = (
    <button
      type="button"
      className={iconBtn}
      onClick={(e) => {
        e.stopPropagation();
        cancelInlineEditor()
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <CloseIcon fontSize="small" />
    </button>
  );

  // position around the node depending on side
  const styleFor = (side: Side) =>
    side === "left"
      ? { top: `${value}%`, left: -240, transform: "translateY(-50%)" }
      : side === "right"
      ? { top: `${value}%`, right: -240, transform: "translateY(-50%)" }
      : side === "top"
      ? { left: `${value}%`, top: -44, transform: "translateX(-50%)" }
      : { left: `${value}%`, bottom: -44, transform: "translateX(-50%)" };

  return (
    <div className={common} style={styleFor(pendingSide)} onMouseDown={(e) => e.stopPropagation()}>
      {SelectEl}
      {AddPortBtn}
      {ConfirmBtn}
      {CancelBtn}
    </div>
  );
})();


  return (
    <div
      className={[
        "w-[220px] rounded-2xl border bg-white shadow-sm",
        "border-slate-200 text-slate-800",
        selected ? "ring-2 ring-indigo-400 ring-offset-2" : "",
      ].join(" ")}
    >
      {/* Header: device name */}
      <div className="px-3 pt-2 pb-1 border-b border-slate-100">
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

      {leftYs.map((y, i) => (
        <Handle
          key={handles?.left?.[i]?.port?.id}
          id={handles?.left?.[i].port?.id}
          type={handles?.left?.[i].direction}
          position={Position.Left}
          style={{ top: `${y}%` }}
        />
      ))}
      {rightYs.map((y, i) => (
        <Handle
          key={handles?.right?.[i].port?.id}
          id={handles?.right?.[i].port?.id}
          type={handles?.right?.[i].direction}
          position={Position.Right}
          style={{ top: `${y}%` }}
        />
      ))}
      {topXs.map((x, i) => (
        <Handle
          key={handles?.top?.[i].port?.id}
          id={handles?.top?.[i].port?.id}
          type={handles?.top?.[i].direction}
          position={Position.Top}
          style={{ left: `${x}%` }}
        />
      ))}
      {bottomXs.map((x, i) => (
        <Handle
          key={handles?.bottom?.[i].port?.id}
          id={handles?.bottom?.[i].port?.id}
          type={handles?.bottom?.[i].direction}
          position={Position.Bottom}
          style={{ left: `${x}%` }}
        />
      ))}

      {editMode && isEditorOpen && inlineEditor}

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
            <IconButton
              size="small"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onRemoveHandle("left");
              }}
              disableRipple
              disableFocusRipple
              sx={{
                p: 0.25,
                bgcolor: "transparent",
                "&:hover": { bgcolor: "transparent" },
              }}
            >
              <RemoveIcon fontSize="small" color="error" />
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
            <IconButton
              size="small"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onRemoveHandle("right");
              }}
              disableRipple
              disableFocusRipple
              sx={{
                p: 0.25,
                bgcolor: "transparent",
                "&:hover": { bgcolor: "transparent" },
              }}
            >
              <RemoveIcon fontSize="small" color="error" />
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
            <IconButton
              size="small"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onRemoveHandle("top");
              }}
              disableRipple
              disableFocusRipple
              sx={{
                p: 0.25,
                bgcolor: "transparent",
                "&:hover": { bgcolor: "transparent" },
              }}
            >
              <RemoveIcon fontSize="small" color="error" />
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
            <IconButton
              size="small"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onRemoveHandle("bottom");
              }}
              disableRipple
              disableFocusRipple
              sx={{
                p: 0.25,
                bgcolor: "transparent",
                "&:hover": { bgcolor: "transparent" },
              }}
            >
              <RemoveIcon fontSize="small" color="error" />
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
