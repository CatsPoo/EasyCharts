import { memo } from "react";
import { Handle, Position, NodeResizer } from "reactflow";
import type { NodeProps } from "reactflow";
import type { CloudOnChart } from "@easy-charts/easycharts-types";
import { useThemeMode } from "../../contexts/ThemeModeContext";

export interface CloudNodeData {
  cloudOnChart: CloudOnChart;
  editMode: boolean;
  onRemove: (cloudId: string) => void;
}

const handleStyle = { width: 10, height: 10, borderRadius: 5 };

function CloudNode({ data, selected }: NodeProps<CloudNodeData>) {
  const { cloudOnChart, editMode, onRemove } = data;
  const { isDark } = useThemeMode();

  const bg = isDark ? "#0c2340" : "#e0f2fe";
  const border = isDark ? "#1e6fa8" : "#38bdf8";
  const headerBg = isDark ? "#0e3258" : "#bae6fd";
  const textColor = isDark ? "#93c5fd" : "#0369a1";

  return (
    <div
      className="w-full h-full flex flex-col rounded-xl overflow-hidden relative"
      style={{
        background: bg,
        border: `2px solid ${border}`,
        boxShadow: selected
          ? "0 0 0 2px #6366f1"
          : isDark
          ? "2px 2px 8px rgba(0,0,0,0.5)"
          : "2px 2px 8px rgba(56,189,248,0.25)",
      }}
    >
      {editMode && (
        <NodeResizer
          minWidth={140}
          minHeight={80}
          lineStyle={{ borderColor: "#38bdf8" }}
          handleStyle={{ background: "#38bdf8", border: "none", borderRadius: 2, width: 8, height: 8 }}
        />
      )}

      {/* Header */}
      <div
        className="flex items-center gap-1.5 px-2 py-1.5 flex-none select-none"
        style={{ background: headerBg, borderBottom: `1px solid ${border}` }}
      >
        {/* Cloud icon */}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ color: textColor, flexShrink: 0 }}>
          <path d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
        </svg>
        <span className="text-[11px] font-semibold truncate flex-1" style={{ color: textColor }}>
          {cloudOnChart.cloud.name}
        </span>
        {editMode && (
          <button
            className="flex-none ml-1 rounded hover:bg-red-500 hover:text-white transition-colors px-1 text-[10px]"
            style={{ color: textColor }}
            onClick={(e) => { e.stopPropagation(); onRemove(cloudOnChart.cloudId); }}
            title="Remove cloud from chart"
          >
            ✕
          </button>
        )}
      </div>

      {/* Description (if any) */}
      {cloudOnChart.cloud.description && (
        <div
          className="flex-1 px-2 py-1.5 text-[10px] overflow-auto"
          style={{ color: isDark ? "#7dd3fc" : "#0c4a6e" }}
        >
          {cloudOnChart.cloud.description}
        </div>
      )}

      {/* Handles — target type so device ports (source) connect to clouds */}
      <Handle type="target" position={Position.Left}   id="left"   style={handleStyle} />
      <Handle type="target" position={Position.Right}  id="right"  style={handleStyle} />
      <Handle type="target" position={Position.Top}    id="top"    style={handleStyle} />
      <Handle type="target" position={Position.Bottom} id="bottom" style={handleStyle} />
    </div>
  );
}

export default memo(CloudNode);
