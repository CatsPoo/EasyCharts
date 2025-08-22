import type { DeviceOnChart, Handles } from "@easy-charts/easycharts-types";
import { useState } from "react";
import type { NodeProps } from "reactflow";
import { Handle, Position } from "reactflow";

type DeviceNodeData = {
  deviceOnChart: DeviceOnChart;
  editmode: boolean;
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
  const { deviceOnChart, editmode } = data;
  const { device, handles: deviceHandles, chartId } = deviceOnChart;
  const { id: deviceId, name, ipAddress, model } = device;
  const { name: modelName, iconUrl, vendor } = model;
  const { name: vendorName } = vendor ?? {};

  const [handles, setHandles] = useState<Handles>(deviceHandles);

  function spread(count: number, pad = 10) {
    if (count <= 0) return [];
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
          key={handles?.left?.[i]}
          id={handles?.left?.[i]}
          type="target"
          position={Position.Left}
          style={{ top: `${y}%` }}
        />
      ))}
      {rightYs.map((y, i) => (
        <Handle
          key={handles?.right?.[i]}
          id={handles?.right?.[i]}
          type="source"
          position={Position.Right}
          style={{ top: `${y}%` }}
        />
      ))}
      {topXs.map((x, i) => (
        <Handle
          key={handles?.top?.[i]}
          id={handles?.top?.[i]}
          type="target"
          position={Position.Top}
          style={{ left: `${x}%` }}
        />
      ))}
      {bottomXs.map((x, i) => (
        <Handle
          key={handles?.bottom?.[i]}
          id={handles?.bottom?.[i]}
          type="target"
          position={Position.Bottom}
          style={{ left: `${x}%` }}
        />
      ))}
    </div>
  );
}
