import { useState } from "react";
import type { Device } from "@easy-charts/easycharts-types";
import { useThemeMode } from "../../contexts/ThemeModeContext";

function initials(text?: string) {
  if (!text) return "?";
  const parts = text.trim().split(" ");
  const a = parts[0]?.[0] ?? "";
  const b = parts[1]?.[0] ?? "";
  return (a + b || a).toUpperCase();
}

interface DevicesSideListProps {
  devicesList: Device[];
}

export function DevicesSidebar({ devicesList }: DevicesSideListProps) {
  const [search, setSearch] = useState("");
  const { isDark } = useThemeMode();

  const filteredDevices = search.trim()
    ? devicesList.filter((device) => {
        const q = search.toLowerCase();
        return (
          device.name.toLowerCase().includes(q) ||
          device.type.name.toLowerCase().includes(q) ||
          device.ipAddress.toLowerCase().includes(q) ||
          device.model.name.toLowerCase().includes(q) ||
          device.vendor.name.toLowerCase().includes(q)
        );
      })
    : devicesList;

  return (
    <aside
      className={[
        "flex flex-col h-full p-3 border-r",
        isDark ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200",
      ].join(" ")}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2
          className={[
            "text-sm font-semibold",
            isDark ? "text-slate-200" : "text-slate-700",
          ].join(" ")}
        >
          Devices
        </h2>
        <span
          className={[
            "text-xs rounded-full px-2 py-0.5",
            isDark
              ? "bg-slate-800 text-slate-400"
              : "bg-slate-100 text-slate-400",
          ].join(" ")}
        >
          {filteredDevices.length}
        </span>
      </div>

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search..."
        className={[
          "w-full mb-3 px-2 py-1.5 text-xs border rounded-md outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400",
          isDark
            ? "bg-slate-800 border-slate-700 text-slate-200 placeholder-slate-500"
            : "bg-slate-50 border-slate-200 text-slate-700 placeholder-slate-400",
        ].join(" ")}
      />

      {/* List */}
      <ul className="flex-1 min-h-0 overflow-y-auto space-y-1.5 pr-0.5">
        {filteredDevices.length === 0 && (
          <li
            className={[
              "text-xs text-center py-6",
              isDark ? "text-slate-600" : "text-slate-400",
            ].join(" ")}
          >
            No devices found
          </li>
        )}
        {filteredDevices.map((device) => (
          <li
            key={device.id}
            draggable
            onDragStart={(event) => {
              event.dataTransfer.setData("application/reactflow", device.id);
              event.dataTransfer.effectAllowed = "move";
            }}
            className={[
              "flex items-center gap-2 px-2 py-2 rounded-lg border border-transparent cursor-grab active:cursor-grabbing transition-colors select-none",
              isDark
                ? "hover:border-indigo-800 hover:bg-indigo-950"
                : "hover:border-indigo-200 hover:bg-indigo-50",
            ].join(" ")}
            title={`${device.name} · ${device.ipAddress}`}
          >
            {/* Avatar */}
            {device.model.iconUrl ? (
              <img
                src={device.model.iconUrl}
                alt={device.model.name}
                draggable={false}
                className={[
                  "h-8 w-8 flex-none rounded-md object-cover border",
                  isDark
                    ? "border-slate-700 bg-slate-800"
                    : "border-slate-200 bg-slate-100",
                ].join(" ")}
              />
            ) : (
              <div className="h-8 w-8 flex-none rounded-md bg-gradient-to-br from-indigo-200 to-indigo-400 text-indigo-900 flex items-center justify-center text-xs font-bold">
                {initials(device.name)}
              </div>
            )}

            {/* Info */}
            <div className="min-w-0 flex-1">
              <p
                className={[
                  "text-xs font-semibold truncate leading-4",
                  isDark ? "text-slate-200" : "text-slate-800",
                ].join(" ")}
              >
                {device.name}
              </p>
              <p
                className={[
                  "text-xs truncate",
                  isDark ? "text-slate-400" : "text-slate-500",
                ].join(" ")}
              >
                {device.model.name}
              </p>
              <p
                className={[
                  "text-[10px] font-mono truncate",
                  isDark ? "text-slate-500" : "text-slate-400",
                ].join(" ")}
              >
                {device.ipAddress}
              </p>
            </div>
          </li>
        ))}
      </ul>

      {/* Footer hint */}
      <p
        className={[
          "mt-3 text-[10px] text-center",
          isDark ? "text-slate-600" : "text-slate-400",
        ].join(" ")}
      >
        Drag a device onto the canvas
      </p>
    </aside>
  );
}
