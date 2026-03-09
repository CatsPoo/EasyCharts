import type { Port, Side } from "@easy-charts/easycharts-types";
import { useMemo, type CSSProperties } from "react";
import { Fragment } from "react/jsx-runtime";
import { Handle, Position } from "reactflow";
import type { onHandleContextMenuPayload } from "./interfaces/contexMenue.interfaces";
import { useThemeMode } from "../../contexts/ThemeModeContext";

interface DeviceHandleProps {
  deviceId: string;
  port: Port;
  side: Side;
  offset: number;
  inUse: boolean;
  isPairedHere: boolean;
  onHandleContextMenu: onHandleContextMenuPayload | undefined;
}
export default function DeviceHandle({
  deviceId,
  port,
  side,
  offset,
  inUse,
  isPairedHere,
  onHandleContextMenu,
}: DeviceHandleProps) {

  const { isDark } = useThemeMode();

  const position = useMemo(() => {
    if (side === "left") return Position.Left;
    if (side === "right") return Position.Right;
    if (side === "top") return Position.Top;
    return Position.Bottom;
  }, [side]);

  const pid = useMemo(() => {
    return port.id;
  }, [port]);

  const redHandleStyle = {
    background: "#ef4444", // Tailwind's red-500
    borderColor: "#b91c1c", // red-700
    boxShadow: "0 0 0 2px rgba(239, 68, 68, 0.25)",
  };

  const greenHandleStyle = {
    background: "#22c55e",
    borderColor: "#15803d",
    boxShadow: "0 0 0 2px rgba(34,197,94,0.25)",
  };

  const portTypeBadgeColor: Record<string, string> = {
    rj45: "bg-blue-500 text-white",
    sfp:  "bg-green-500 text-white",
    qsfp: "bg-purple-500 text-white",
  };

  const labelClass = [
    "absolute text-[10px] leading-none px-1 py-0.5 rounded select-none cursor-context-menu",
    isDark
      ? "bg-slate-700 text-white"
      : "bg-white text-slate-700 border border-slate-300",
  ].join(" ");

  const labelStyle = (): CSSProperties => {
    // v is %: y for left/right, x for top/bottom
    // Keep 14px gap from handle edge so the React Flow edge reconnect
    // endpoint (rendered in the SVG layer below nodes) stays clickable.
    if (side === "left")
      return {
        top: `${offset}%`,
        left: -14,
        transform: "translate(-100%, -50%)",
      };
    if (side === "right")
      return {
        top: `${offset}%`,
        left: "100%",
        marginLeft: 14,
        transform: "translate(0, -50%)",
      };
    if (side === "top")
      return {
        left: `${offset}%`,
        top: -14,
        transform: "translate(-50%, -100%)",
      };
    // bottom
    return {
      left: `${offset}%`,
      top: "100%",
      marginTop: 14,
      transform: "translate(-50%, 0)",
    };
  };

  const handleStyle = (): CSSProperties => {
    const colorStyle = isPairedHere ? greenHandleStyle : inUse ? redHandleStyle : {};
    if (side === "left" || side === "right")
      return { top: `${offset}%`, ...colorStyle };
    return { left: `${offset}%`, ...colorStyle };
  };

  return (
    <Fragment key={`${side}-${pid}`}>
      <Handle
        key={`${pid}-s`}
        id={pid}
        type="source"
        position={position}
        style={handleStyle()}
        isConnectableEnd={false}
        isConnectableStart={true}
        onContextMenu={(e) =>
          onHandleContextMenu?.(e, {
            deviceId,
            portId: pid,
            role: "source",
            side: side,
          })
        }
      />
      <Handle
        key={`${pid}-t`}
        id={pid}
        type="target"
        position={position}
        style={handleStyle()}
        isConnectableStart={false}
        isConnectableEnd={true}
        onContextMenu={(e) =>
          onHandleContextMenu?.(e, {
            deviceId,
            portId: pid,
            role: "target",
            side: side,
          })
        }
      />
      <div
        className={labelClass}
        style={labelStyle()}
        title={`${port.name} (${port.type.toUpperCase()})`}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onHandleContextMenu?.(e, { deviceId, portId: pid, role: "source", side });
        }}
      >
        <div>{port.name}</div>
        <div className={`text-[9px] font-semibold rounded px-0.5 mt-0.5 ${portTypeBadgeColor[port.type] ?? ""}`}>
          {port.type.toUpperCase()}
        </div>
      </div>
    </Fragment>
  );
}
