import { useEffect, useRef, useState } from "react";
import type { DeviceOnChart, HandleInfo, Handles, Side } from "@easy-charts/easycharts-types";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import { useThemeMode } from "../../contexts/ThemeModeContext";

interface PortsEditorDialogProps {
  open: boolean;
  deviceOnChart: DeviceOnChart | null;
  onClose: () => void;
  onConfirm: (newHandles: Handles) => void;
}

const sideLabel: Record<Side, string> = {
  top: "Top",
  right: "Right",
  bottom: "Bottom",
  left: "Left",
};

const portTypeBadgeColor: Record<string, string> = {
  rj45: "bg-blue-500 text-white",
  sfp: "bg-green-500 text-white",
  qsfp: "bg-purple-500 text-white",
};

export function PortsEditorDialog({
  open,
  deviceOnChart,
  onClose,
  onConfirm,
}: PortsEditorDialogProps) {
  const { isDark } = useThemeMode();

  const [handles, setHandles] = useState<Handles>({
    left: [],
    right: [],
    top: [],
    bottom: [],
  });

  useEffect(() => {
    if (open && deviceOnChart) {
      setHandles({
        left: [...(deviceOnChart.handles.left ?? [])],
        right: [...(deviceOnChart.handles.right ?? [])],
        top: [...(deviceOnChart.handles.top ?? [])],
        bottom: [...(deviceOnChart.handles.bottom ?? [])],
      });
    }
  }, [open, deviceOnChart]);

  const dragRef = useRef<{ portId: string; fromSide: Side } | null>(null);

  const handleDragStart = (portId: string, fromSide: Side) => {
    dragRef.current = { portId, fromSide };
  };

  const handleDrop = (toSide: Side) => {
    if (!dragRef.current) return;
    const { portId, fromSide } = dragRef.current;
    dragRef.current = null;
    if (fromSide === toSide) return;
    setHandles((prev) => {
      const handleToMove = prev[fromSide]?.find((h) => h.port.id === portId);
      if (!handleToMove) return prev;
      return {
        ...prev,
        [fromSide]: (prev[fromSide] ?? []).filter((h) => h.port.id !== portId),
        [toSide]: [...(prev[toSide] ?? []), handleToMove],
      };
    });
  };

  if (!deviceOnChart) return null;
  const { device } = deviceOnChart;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      slotProps={{
        paper: {
          sx: isDark
            ? { bgcolor: "#0f172a", color: "#f1f5f9", borderColor: "#334155" }
            : {},
        },
      }}
    >
      <DialogTitle sx={isDark ? { color: "#f1f5f9", borderBottom: "1px solid #334155" } : {}}>
        Edit Port Placement — {device.name}
      </DialogTitle>
      <DialogContent>
        <p className={["text-xs mb-4 mt-2", isDark ? "text-slate-400" : "text-slate-500"].join(" ")}>
          Drag ports between sides to reposition them on the device.
        </p>
        <div className="flex flex-col gap-2">
          {/* TOP */}
          <SideDropZone
            side="top"
            handles={handles.top}
            onDragStart={handleDragStart}
            onDrop={handleDrop}
            horizontal
            isDark={isDark}
          />

          {/* Middle row */}
          <div className="flex gap-2 items-stretch min-h-[140px]">
            {/* LEFT */}
            <SideDropZone
              side="left"
              handles={handles.left}
              onDragStart={handleDragStart}
              onDrop={handleDrop}
              horizontal={false}
              isDark={isDark}
            />

            {/* Device preview — matches DeviceNode card */}
            <div
              className={[
                "flex-1 rounded-2xl border shadow-sm flex flex-col items-center justify-center p-4",
                isDark
                  ? "bg-slate-900 border-slate-700 text-slate-100"
                  : "bg-white border-slate-200 text-slate-900",
              ].join(" ")}
            >
              <div className="text-sm font-semibold">{device.name}</div>
              {device.model?.name && (
                <div className={["text-xs mt-0.5", isDark ? "text-slate-400" : "text-slate-500"].join(" ")}>
                  {device.model.name}
                </div>
              )}
              {device.ipAddress && (
                <div className={["text-xs mt-1", isDark ? "text-slate-500" : "text-slate-400"].join(" ")}>
                  {device.ipAddress}
                </div>
              )}
            </div>

            {/* RIGHT */}
            <SideDropZone
              side="right"
              handles={handles.right}
              onDragStart={handleDragStart}
              onDrop={handleDrop}
              horizontal={false}
              isDark={isDark}
            />
          </div>

          {/* BOTTOM */}
          <SideDropZone
            side="bottom"
            handles={handles.bottom}
            onDragStart={handleDragStart}
            onDrop={handleDrop}
            horizontal
            isDark={isDark}
          />
        </div>
      </DialogContent>
      <DialogActions sx={isDark ? { borderTop: "1px solid #334155" } : {}}>
        <Button onClick={onClose} sx={isDark ? { color: "#94a3b8" } : {}}>Cancel</Button>
        <Button
          variant="contained"
          onClick={() => {
            onConfirm(handles);
            onClose();
          }}
        >
          Apply
        </Button>
      </DialogActions>
    </Dialog>
  );
}

interface SideDropZoneProps {
  side: Side;
  handles: HandleInfo[];
  onDragStart: (portId: string, side: Side) => void;
  onDrop: (side: Side) => void;
  horizontal: boolean;
  isDark: boolean;
}

function SideDropZone({ side, handles, onDragStart, onDrop, horizontal, isDark }: SideDropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const zoneClass = [
    "flex gap-1.5 rounded-lg border-2 border-dashed p-2 transition-colors",
    isDragOver
      ? isDark
        ? "border-indigo-400 bg-indigo-950"
        : "border-indigo-400 bg-indigo-50"
      : isDark
        ? "border-slate-600 bg-slate-800"
        : "border-slate-200 bg-slate-50",
    horizontal
      ? "flex-wrap justify-center min-h-[52px] items-center"
      : "flex-col items-center w-32 flex-none justify-start",
  ].join(" ");

  const labelClass = [
    "text-[10px] font-semibold uppercase tracking-wide select-none",
    isDark ? "text-slate-500" : "text-slate-400",
  ].join(" ");

  const chipClass = [
    "px-2 py-0.5 rounded text-[11px] border cursor-grab shadow-sm select-none",
    "hover:border-indigo-400 hover:shadow-md active:cursor-grabbing transition-colors",
    isDark
      ? "bg-slate-700 text-slate-100 border-slate-600"
      : "bg-white text-slate-700 border-slate-300",
  ].join(" ");

  return (
    <div
      className={zoneClass}
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setIsDragOver(false); onDrop(side); }}
    >
      <span className={labelClass}>{sideLabel[side]}</span>
      {handles.map((h) => (
        <div
          key={h.port.id}
          draggable
          onDragStart={() => onDragStart(h.port.id, side)}
          className={chipClass}
        >
          <div className="leading-none">{h.port.name}</div>
          <div className={`text-[9px] font-semibold rounded px-0.5 mt-0.5 ${portTypeBadgeColor[h.port.type] ?? "bg-slate-400 text-white"}`}>
            {h.port.type.toUpperCase()}
          </div>
        </div>
      ))}
    </div>
  );
}
