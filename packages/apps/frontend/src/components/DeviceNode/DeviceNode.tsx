//DeviceNodes


import {
  type HandleInfo,
  type Port,
  type PortType,
  type Side,
} from "@easy-charts/easycharts-types";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import ComputerIcon from "@mui/icons-material/Computer";
import PhoneIcon from "@mui/icons-material/Phone";
import RouterIcon from "@mui/icons-material/Router";
import SettingsEthernetIcon from "@mui/icons-material/SettingsEthernet";
import StorageIcon from "@mui/icons-material/Storage";
import { IconButton } from "@mui/material";
import type { SvgIconComponent } from "@mui/icons-material";
import { PortFormDialog } from "../PortFormDialog";
import { useLayoutEffect, useMemo, useState } from "react";
import type { NodeProps } from "reactflow";
import { useUpdateNodeInternals } from "reactflow";
import { v4 as uuidv4 } from "uuid";
import type { DeviceNodeData } from "./interfaces/deviceModes.interfaces";
import { useThemeMode } from "../../contexts/ThemeModeContext";
import type { SidesOffset } from "./interfaces/sidesOffset.interface";
import { InlineEditor } from "./InlineEditor";
import DeviceHandle from "./DeviceHandle";

const DEVICE_TYPE_ICONS: Record<string, SvgIconComponent> = {
  Router: RouterIcon,
  Switch: SettingsEthernetIcon,
  Computer: ComputerIcon,
  Server: StorageIcon,
  Phone: PhoneIcon,
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
  const { deviceOnChart, editMode, updateDeviceOnChart, onRemoveNode, onHandleContextMenu, greenPortIds, overlayPortIds, onPortAdded } = data;
  const { device, handles } = deviceOnChart;
  const { id: deviceId, name, ipAddress, model } = device;
  const { name: modelName, iconUrl, vendor } = model;
  const { name: vendorName } = vendor ?? {};

  const { isDark } = useThemeMode();

  const [pendingSide, setPendingSide] = useState<Side | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const updateInternals = useUpdateNodeInternals();

  const [selectedPortId, setSelectedPortId] = useState<string>("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
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

  const defaultPortValues: Port = {
    id: uuidv4(),
    name: "",
    type: "rj45",
    deviceId,
    inUse: false,
    createdAt: new Date(),
    createdByUserId: undefined as any,
    updatedAt: null,
    updatedByUserId: null,
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
  }, [deviceId, updateInternals]);

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
    onPortAdded?.(port.id, deviceId, side);
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

  const onCreatePort = ({ name, type }: { name: string; type: PortType }) => {
    if (!pendingSide || !newPort) return;
    const portToUse: Port = { ...newPort, name, type };
    updateDeviceOnChart({
      ...deviceOnChart,
      device: { ...device, ports: [...device.ports, portToUse] },
    });
    setSelectedPortId(portToUse.id);
    setNewPort(null);
    setCreateDialogOpen(false);
  };

  const isPortInUse = (portId?: string) =>
    !!portId && (device.ports ?? []).some((p) => p.id === portId && p.inUse);

  const nextOffsetForSide = (side: Side) : SidesOffset=> {
    if (side === "left")
      return { axis: "y", value: spread(handles.left.length + 1).at(-1) ?? 0 };
    if (side === "right")
      return { axis: "y", value: spread(handles.right.length + 1).at(-1) ?? 0 };
    if (side === "top")
      return { axis: "x", value: spread(handles.top.length + 1).at(-1) ?? 0 };
    return { axis: "x", value: spread(handles.bottom.length + 1).at(-1) ?? 0 }; // bottom
  };

  const renderHandleBySide = (side:Side,port:Port,offset:number) =>{
        return <DeviceHandle
        deviceId={deviceId}
        port={port}
        side={side}
        offset={offset}
        inUse={isPortInUse(port.id)}
        isPairedHere={greenPortIds.has(port.id)}
        isOverlayConnected={overlayPortIds.has(port.id)}
        onHandleContextMenu={onHandleContextMenu}
        />;
  }

  return (
    <div
      className={[
        "relative w-[280px] rounded-xl border shadow-md overflow-visible",
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
          onMouseDown={(e) => e.stopPropagation()}
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

      {/* Image banner */}
      <div
        className={[
          "relative w-full h-24 rounded-t-xl overflow-hidden flex items-center justify-center",
          isDark ? "bg-slate-800" : "bg-slate-100",
        ].join(" ")}
      >
        {iconUrl ? (
          <img
            src={iconUrl}
            onError={() => ""}
            alt={modelName ? `${modelName} icon` : "Model icon"}
            className="w-full h-full object-contain select-none p-2"
            loading="lazy"
            decoding="async"
            draggable={false}
          />
        ) : device.type?.iconUrl ? (
          <img
            src={device.type.iconUrl}
            alt={device.type.name}
            className={["w-14 h-14 object-contain select-none", isDark ? "opacity-60" : "opacity-50"].join(" ")}
            draggable={false}
          />
        ) : (() => {
          const DeviceTypeIcon = DEVICE_TYPE_ICONS[device.type?.name];
          return DeviceTypeIcon
            ? <DeviceTypeIcon sx={{ fontSize: 56 }} className={isDark ? "!text-slate-500" : "!text-slate-400"} />
            : <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-indigo-200 to-indigo-400 text-indigo-900 flex items-center justify-center text-2xl font-bold select-none">{initials(name)}</div>;
        })()}

        {/* Vendor icon badge */}
        {vendor?.iconUrl && (
          <img
            src={vendor.iconUrl}
            alt={vendorName ?? "Vendor"}
            className="absolute bottom-1 right-2 h-5 w-auto max-w-[56px] object-contain opacity-75 select-none"
            draggable={false}
          />
        )}
      </div>

      {/* Info row */}
      <div
        className={[
          "px-3 py-2 border-t",
          isDark ? "border-slate-700" : "border-slate-200",
        ].join(" ")}
      >
        <div className="text-base font-semibold truncate leading-5">{name ?? "Device"}</div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <div className="min-w-0">
            <span className="text-sm font-medium truncate">{modelName ?? "Model"}</span>
            {vendorName ? (
              <span className="text-xs text-slate-500 truncate"> · {vendorName}</span>
            ) : null}
          </div>
          <div className="text-xs text-slate-400 shrink-0 font-mono">
            {ipAddress ?? "—"}
          </div>
        </div>
      </div>

      {leftYs.map((y, i) => {
        const port = handles.left?.[i]?.port;
        return <span key={port?.id ?? `left-${i}`}>{renderHandleBySide("left", port, y)}</span>;
      })}
      {rightYs.map((y, i) => {
        const port = handles.right?.[i]?.port;
        return <span key={port?.id ?? `right-${i}`}>{renderHandleBySide("right", port, y)}</span>;
      })}
      {topXs.map((x, i) => {
        const port = handles.top?.[i]?.port;
        return <span key={port?.id ?? `top-${i}`}>{renderHandleBySide("top", port, x)}</span>;
      })}
      {bottomXs.map((x, i) => {
        const port = handles.bottom?.[i]?.port;
        return <span key={port?.id ?? `bottom-${i}`}>{renderHandleBySide("bottom", port, x)}</span>;
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

      <PortFormDialog
        open={createDialogOpen}
        title="Create Port"
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={onCreatePort}
      />
    </div>
  );
}
