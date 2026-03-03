import { useState } from "react";
import type { Device, Cloud } from "@easy-charts/easycharts-types";
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
  cloudsList: Cloud[];
  onCreateDevice?: () => void;
  onCreateCloud?: () => void;
}

type ActiveTab = "devices" | "elements" | "clouds";

export function DevicesSidebar({ devicesList, cloudsList, onCreateDevice, onCreateCloud }: DevicesSideListProps) {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<ActiveTab>("devices");
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

  const filteredClouds = search.trim()
    ? cloudsList.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    : cloudsList;

  const tabBase =
    "flex-1 py-1.5 flex flex-col items-center justify-center gap-0.5 rounded transition-colors";

  const tabActive = isDark ? "bg-indigo-600 text-white" : "bg-blue-900 text-white";
  const tabInactive = isDark ? "text-slate-400 hover:text-slate-200" : "bg-blue-600 text-white hover:bg-blue-700";

  return (
    <aside
      className={[
        "flex flex-col h-full p-3 border-r",
        isDark ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200",
      ].join(" ")}
    >
      {/* Tabs */}
      <div
        className={[
          "flex gap-1 p-0.5 rounded-lg mb-3",
          isDark ? "bg-slate-800" : "bg-blue-200",
        ].join(" ")}
      >
        {/* Devices — server rack icon */}
        <button className={[tabBase, activeTab === "devices" ? tabActive : tabInactive].join(" ")} onClick={() => setActiveTab("devices")}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 3H4c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 5H5V6h14v2zM4 13h16c1.1 0 2-.9 2-2v-1H2v1c0 1.1.9 2 2 2zm0 6h16c1.1 0 2-.9 2-2v-1H2v1c0 1.1.9 2 2 2z"/>
          </svg>
          <span className="text-[9px] font-semibold leading-none">Devices</span>
        </button>
        {/* Clouds — cloud icon */}
        <button className={[tabBase, activeTab === "clouds" ? tabActive : tabInactive].join(" ")} onClick={() => setActiveTab("clouds")}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"/>
          </svg>
          <span className="text-[9px] font-semibold leading-none">Clouds</span>
        </button>
        {/* Elements — dashboard/grid icon */}
        <button className={[tabBase, activeTab === "elements" ? tabActive : tabInactive].join(" ")} onClick={() => setActiveTab("elements")}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
          </svg>
          <span className="text-[9px] font-semibold leading-none">Elements</span>
        </button>
      </div>

      {/* ── Devices Tab ── */}
      {activeTab === "devices" && (
        <>
          <div className="flex items-center justify-between mb-3">
            <h2 className={["text-sm font-semibold", isDark ? "text-slate-200" : "text-slate-700"].join(" ")}>Devices</h2>
            <div className="flex items-center gap-1.5">
              <span className={["text-xs rounded-full px-2 py-0.5", isDark ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-400"].join(" ")}>
                {filteredDevices.length}
              </span>
              {onCreateDevice && (
                <button
                  onClick={onCreateDevice}
                  title="Create new device"
                  className={["flex items-center justify-center w-5 h-5 rounded text-xs font-bold transition-colors",
                    isDark ? "bg-indigo-700 hover:bg-indigo-600 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"].join(" ")}
                >+</button>
              )}
            </div>
          </div>

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className={[
              "w-full mb-3 px-2 py-1.5 text-xs border rounded-md outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400",
              isDark ? "bg-slate-800 border-slate-700 text-slate-200 placeholder-slate-500" : "bg-slate-50 border-slate-200 text-slate-700 placeholder-slate-400",
            ].join(" ")}
          />

          <ul className="flex-1 min-h-0 overflow-y-auto space-y-1.5 pr-0.5">
            {filteredDevices.length === 0 && (
              <li className={["text-xs text-center py-6", isDark ? "text-slate-600" : "text-slate-400"].join(" ")}>No devices found</li>
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
                  isDark ? "hover:border-indigo-800 hover:bg-indigo-950" : "hover:border-indigo-200 hover:bg-indigo-50",
                ].join(" ")}
                title={`${device.name} · ${device.ipAddress}`}
              >
                {device.model.iconUrl ? (
                  <img src={device.model.iconUrl} alt={device.model.name} draggable={false}
                    className={["h-8 w-8 flex-none rounded-md object-cover border", isDark ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-slate-100"].join(" ")} />
                ) : (
                  <div className="h-8 w-8 flex-none rounded-md bg-gradient-to-br from-indigo-200 to-indigo-400 text-indigo-900 flex items-center justify-center text-xs font-bold">
                    {initials(device.name)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className={["text-xs font-semibold truncate leading-4", isDark ? "text-slate-200" : "text-slate-800"].join(" ")}>{device.name}</p>
                  <p className={["text-xs truncate", isDark ? "text-slate-400" : "text-slate-500"].join(" ")}>{device.model.name}</p>
                  <p className={["text-[10px] font-mono truncate", isDark ? "text-slate-500" : "text-slate-400"].join(" ")}>{device.ipAddress}</p>
                </div>
              </li>
            ))}
          </ul>

          <p className={["mt-3 text-[10px] text-center", isDark ? "text-slate-600" : "text-slate-400"].join(" ")}>Drag a device onto the canvas</p>
        </>
      )}

      {/* ── Clouds Tab ── */}
      {activeTab === "clouds" && (
        <>
          <div className="flex items-center justify-between mb-3">
            <h2 className={["text-sm font-semibold", isDark ? "text-slate-200" : "text-slate-700"].join(" ")}>Clouds</h2>
            <div className="flex items-center gap-1.5">
              <span className={["text-xs rounded-full px-2 py-0.5", isDark ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-400"].join(" ")}>
                {filteredClouds.length}
              </span>
              {onCreateCloud && (
                <button
                  onClick={onCreateCloud}
                  title="Create new cloud"
                  className={["flex items-center justify-center w-5 h-5 rounded text-xs font-bold transition-colors",
                    isDark ? "bg-sky-700 hover:bg-sky-600 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"].join(" ")}
                >+</button>
              )}
            </div>
          </div>

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clouds..."
            className={[
              "w-full mb-3 px-2 py-1.5 text-xs border rounded-md outline-none focus:ring-1 focus:ring-sky-400 focus:border-sky-400",
              isDark ? "bg-slate-800 border-slate-700 text-slate-200 placeholder-slate-500" : "bg-slate-50 border-slate-200 text-slate-700 placeholder-slate-400",
            ].join(" ")}
          />

          <ul className="flex-1 min-h-0 overflow-y-auto space-y-1.5 pr-0.5">
            {filteredClouds.length === 0 && (
              <li className={["text-xs text-center py-6", isDark ? "text-slate-600" : "text-slate-400"].join(" ")}>No clouds found</li>
            )}
            {filteredClouds.map((cloud) => (
              <li
                key={cloud.id}
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.setData("application/reactflow-cloud", JSON.stringify({ cloudId: cloud.id }));
                  event.dataTransfer.effectAllowed = "move";
                }}
                className={[
                  "flex items-center gap-2 px-2 py-2 rounded-lg border border-transparent cursor-grab active:cursor-grabbing transition-colors select-none",
                  isDark ? "hover:border-sky-800 hover:bg-sky-950" : "hover:border-sky-200 hover:bg-sky-50",
                ].join(" ")}
                title={cloud.description ?? cloud.name}
              >
                <div
                  className="h-8 w-8 flex-none rounded-md flex items-center justify-center"
                  style={{ background: isDark ? "#0c2340" : "#e0f2fe", border: isDark ? "1px solid #1e6fa8" : "1px solid #38bdf8" }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ color: isDark ? "#38bdf8" : "#0369a1" }}>
                    <path d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className={["text-xs font-semibold truncate leading-4", isDark ? "text-slate-200" : "text-slate-800"].join(" ")}>{cloud.name}</p>
                  {cloud.description && (
                    <p className={["text-[10px] truncate", isDark ? "text-slate-500" : "text-slate-400"].join(" ")}>{cloud.description}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>

          <p className={["mt-3 text-[10px] text-center", isDark ? "text-slate-600" : "text-slate-400"].join(" ")}>Drag a cloud onto the canvas</p>
        </>
      )}

      {/* ── Elements Tab ── */}
      {activeTab === "elements" && (
        <>
          <h2 className={["text-sm font-semibold mb-3", isDark ? "text-slate-200" : "text-slate-700"].join(" ")}>Chart Elements</h2>

          <ul className="flex-1 min-h-0 overflow-y-auto space-y-1.5">
            <li
              draggable
              onDragStart={(event) => {
                event.dataTransfer.setData("application/reactflow-element", JSON.stringify({ type: "note" }));
                event.dataTransfer.effectAllowed = "move";
              }}
              className={[
                "flex items-center gap-2 px-2 py-2 rounded-lg border border-transparent cursor-grab active:cursor-grabbing transition-colors select-none",
                isDark ? "hover:border-yellow-800 hover:bg-yellow-950" : "hover:border-yellow-300 hover:bg-yellow-50",
              ].join(" ")}
              title="Note — drag onto canvas"
            >
              <div className="h-8 w-8 flex-none rounded-md flex items-center justify-center"
                style={{ background: isDark ? "#3d3822" : "#fef9c3", border: isDark ? "1px solid #6b6430" : "1px solid #fde047" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ color: isDark ? "#b5a84e" : "#854d0e" }}>
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14l4-4h12c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className={["text-xs font-semibold leading-4", isDark ? "text-slate-200" : "text-slate-800"].join(" ")}>Note</p>
                <p className={["text-[10px]", isDark ? "text-slate-500" : "text-slate-400"].join(" ")}>Free text area</p>
              </div>
            </li>

            <li
              draggable
              onDragStart={(event) => {
                event.dataTransfer.setData("application/reactflow-element", JSON.stringify({ type: "zone" }));
                event.dataTransfer.effectAllowed = "move";
              }}
              className={[
                "flex items-center gap-2 px-2 py-2 rounded-lg border border-transparent cursor-grab active:cursor-grabbing transition-colors select-none",
                isDark ? "hover:border-blue-800 hover:bg-blue-950" : "hover:border-blue-300 hover:bg-blue-50",
              ].join(" ")}
              title="Zone — drag onto canvas"
            >
              <div className="h-8 w-8 flex-none rounded-md flex items-center justify-center"
                style={{ background: isDark ? "#1a2a3d" : "#dbeafe", border: isDark ? "2px dashed #1a3a7a" : "2px dashed #93c5fd" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: isDark ? "#60a5fa" : "#1e40af" }}>
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className={["text-xs font-semibold leading-4", isDark ? "text-slate-200" : "text-slate-800"].join(" ")}>Zone</p>
                <p className={["text-[10px]", isDark ? "text-slate-500" : "text-slate-400"].join(" ")}>Background area marker</p>
              </div>
            </li>
          </ul>

          <p className={["mt-3 text-[10px] text-center", isDark ? "text-slate-600" : "text-slate-400"].join(" ")}>Drag an element onto the canvas</p>
        </>
      )}
    </aside>
  );
}
