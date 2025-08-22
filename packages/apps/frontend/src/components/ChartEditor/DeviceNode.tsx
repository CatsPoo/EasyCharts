import type { NodeProps } from "reactflow";
import { Handle, Position } from "reactflow";

type DeviceNodeData = {
  name: string;
  ip?: string | null;
  modelName?: string | null;
  modelIconUrl?: string | null; // you can wire this later
  vendorName?: string | null;
};

function initials(text?: string | null) {
  if (!text) return "MD";
  const parts = text.trim().split(/\s+/);
  const a = parts[0]?.[0] ?? "";
  const b = parts[1]?.[0] ?? "";
  return (a + b || a || "M").toUpperCase();
}

export default function DeviceNode({ data, selected }: NodeProps<DeviceNodeData>) {
  const { name, ip, modelName, modelIconUrl, vendorName } = data ?? {};

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
        {/* Model row */}
        <div className="flex items-center gap-2">
          {/* Avatar / placeholder */}
          {modelIconUrl ? (
            // later swap to <img src={modelIconUrl} ... />
            <div className="h-8 w-8 rounded-lg bg-slate-200 flex items-center justify-center text-xs font-bold">
              IMG
            </div>
          ) : (
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-200 to-indigo-400 text-indigo-900 flex items-center justify-center text-xs font-bold">
              {initials(modelName)}
            </div>
          )}
          <div className="min-w-0">
            <div className="text-xs font-medium leading-4 truncate">
              {modelName ?? "Model"}
            </div>
            {vendorName ? (
              <div className="text-[11px] text-slate-500 leading-4 truncate">{vendorName}</div>
            ) : null}
          </div>
        </div>

        {/* IP row */}
        <div className="text-xs">
          <span className="text-slate-500">IP: </span>
          <span className="font-medium">{ip ?? "—"}</span>
        </div>
      </div>

      {/* Connection handles */}
      <Handle type="target" position={Position.Left} className="!bg-slate-400" />
      <Handle type="source" position={Position.Right} className="!bg-indigo-500" />
    </div>
  );
}