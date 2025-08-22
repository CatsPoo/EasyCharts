import type {
  DeviceOnChart,
  Handles,
  Port,
} from "@easy-charts/easycharts-types";
import { useEffect, useState } from "react";
import type { NodeProps } from "reactflow";
import { Handle, Position, useUpdateNodeInternals } from "reactflow";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import { IconButton } from "@mui/material";
import { v4 as uuidv4 } from "uuid";

type DeviceNodeData = {
  deviceOnChart: DeviceOnChart;
  editMode: boolean;
};

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
  const { deviceOnChart, editMode } = data;
  const { device, handles: deviceHandles, chartId } = deviceOnChart;
  const { id: deviceId, name, ipAddress, model } = device;
  const { name: modelName, iconUrl, vendor } = model;
  const { name: vendorName } = vendor ?? {};

  type Side = "left" | "right" | "top" | "bottom";
  const [handles, setHandles] = useState<Handles>(deviceHandles);
  const [pendingSide, setPendingSide] = useState<Side | null>(null);
  const [draftValue, setDraftValue] = useState("");
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const updateInternals = useUpdateNodeInternals();

  function spread(count: number, pad = 10) {
    if (count <= 0) return [];
    if (count === 1) return [50];
    const usable = 100 - pad * 2;
    return Array.from(
      { length: count },
      (_, i) => pad + (i * usable) / (count - 1)
    );
  }

  const leftYs = spread(handles?.left?.length ?? 0);
  const rightYs = spread(handles?.right?.length ?? 0);
  const topXs = spread(handles?.top?.length ?? 0);
  const bottomXs = spread(handles?.bottom?.length ?? 0);

  useEffect(() => {
    updateInternals(deviceId);
  }, [
    deviceId,
    editMode,
    handles?.left?.length,
    handles?.right?.length,
    handles?.top?.length,
    handles?.bottom?.length,
    updateInternals,
  ]);

  const onAddHandle = (side:Side) => {
    if(isEditorOpen) return;
    setIsEditorOpen(true);
    let newport: Port = { id: uuidv4(), name: draftValue };
    switch (side) {
      case "left":
        setHandles({
          ...handles,
          left: [...(handles.left ?? []), newport],
        });
        break;
      case "right":
        setHandles({
          ...handles,
          right: [...(handles.right ?? []), newport],
        });
        break;
      case "top":
        setHandles({
          ...handles,
          top: [...(handles.top ?? []), newport],
        });
        break;
      case "bottom":
        setHandles({
          ...handles,
          bottom: [...(handles.bottom ?? []), newport],
        });
        break;
    }
    setPendingSide(side)
  };

  const onConfirmAdd = (side: Side, value: string) => {
    setIsEditorOpen(false);
    setDraftValue("");
  };
  const onRemoveHandle = (side:Side) => {
    // TODO: implement remove handle for `side`
  };

  const nextOffsetForSide = (side: Side) => {
    if (side === "left")   return { axis: "y", value: spread(handles.left.length + 1).at(-1) ?? 0 };
    if (side === "right")  return { axis: "y", value: spread(handles.right.length + 1).at(-1) ?? 0 };
    if (side === "top")    return { axis: "x", value: spread(handles.top.length + 1).at(-1) ?? 0 };
    return { axis: "x", value: spread(handles.bottom.length + 1).at(-1) ?? 0 }; // bottom
  };

  const confirmInlineEditor = () => {
    if (!pendingSide) return;
    onConfirmAdd(pendingSide, draftValue.trim());
    setPendingSide(null);
    setDraftValue("");
  };

  const cancelInlineEditor = () => {
    setDraftValue("");
    setIsEditorOpen(false);

    switch (pendingSide) {
      case "left":
        setHandles({
          ...handles,
          left: (handles.left ?? []).slice(0, -1),
        });
        break
      case "right":
        setHandles({
          ...handles,
          right: (handles.right ?? []).slice(0, -1),
        });
        break
      case "top":
        setHandles({
          ...handles,
          top: (handles.top ?? []).slice(0, -1),
        });
        break
      case "bottom":
        setHandles({
          ...handles,
          bottom: (handles.bottom ?? []).slice(0, -1),
        });
        break
    }
    setPendingSide(null);
  };

  const TransparentBtn: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = (props) => (
    <button
      {...props}
      className={[
        "h-7 w-7 rounded-full bg-transparent border-0 shadow-none",
        "flex items-center justify-center hover:bg-transparent active:bg-transparent focus:outline-none",
        props.className ?? ""
      ].join(" ")}
      onMouseDown={(e) => { e.stopPropagation(); props.onMouseDown?.(e); }}
      onClick={(e) => { e.stopPropagation(); props.onClick?.(e); }}
    />
  );

  const inlineEditor = (() => {
    if (!pendingSide) return null;
    const { value } = nextOffsetForSide(pendingSide);
    const common = "absolute z-10 flex items-center gap-1";
    const input =
      "h-7 rounded-md border border-slate-300 bg-white px-2 text-xs shadow focus:outline-none focus:ring";
    const btn =
     "inline-flex items-center justify-center w-7 h-7 rounded-md border border-slate-300 " +
  "bg-white shadow hover:bg-slate-50 focus:outline-none";

    const InputEl = (
      <input
        autoFocus
        value={draftValue}
        onChange={(e) => setDraftValue(e.target.value)}
        placeholder="new handle id"
        className={input}
        onMouseDown={(e) => e.stopPropagation()}
      />
    );

    const ConfirmBtn = (
      <button
        type="button"
        className={btn}
        onClick={(e) => {
          e.stopPropagation();
          confirmInlineEditor();
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <CheckIcon htmlColor="#2563eb" fontSize="small" />
      </button>
    );

    const CancelBtn = (
      <button
        type="button"
        className={btn}
        onClick={(e) => {
          e.stopPropagation();
          cancelInlineEditor();
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <CloseIcon htmlColor="#9ca3af" fontSize="small" />
      </button>
    );

    if (pendingSide === "left") {
      return (
        <div
          className={common}
          style={{
            top: `${value}%`,
            left: -200,
            transform: "translateY(-50%)",
          }}
        >
          {InputEl}
          {ConfirmBtn}
          {CancelBtn}
        </div>
      );
    }
    if (pendingSide === "right") {
      return (
        <div
          className={common}
          style={{
            top: `${value}%`,
            right: -200,
            transform: "translateY(-50%)",
          }}
        >
          {InputEl}
          {ConfirmBtn}
          {CancelBtn}
        </div>
      );
    }
    if (pendingSide === "top") {
      return (
        <div
          className={common}
          style={{ left: `${value}%`, top: -38, transform: "translateX(-50%)" }}
        >
          {InputEl}
          {ConfirmBtn}
          {CancelBtn}
        </div>
      );
    }
    // bottom
    return (
      <div
        className={common}
        style={{
          left: `${value}%`,
          bottom: -38,
          transform: "translateX(-50%)",
        }}
      >
        {InputEl}
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
          key={handles?.left?.[i].id}
          id={handles?.left?.[i].id}
          type="target"
          position={Position.Left}
          style={{ top: `${y}%` }}
        />
      ))}
      {rightYs.map((y, i) => (
        <Handle
          key={handles?.right?.[i].id}
          id={handles?.right?.[i].id}
          type="source"
          position={Position.Right}
          style={{ top: `${y}%` }}
        />
      ))}
      {topXs.map((x, i) => (
        <Handle
          key={handles?.top?.[i].id}
          id={handles?.top?.[i].id}
          type="target"
          position={Position.Top}
          style={{ left: `${x}%` }}
        />
      ))}
      {bottomXs.map((x, i) => (
        <Handle
          key={handles?.bottom?.[i].id}
          id={handles?.bottom?.[i].id}
          type="target"
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
    </div>
  );
}
