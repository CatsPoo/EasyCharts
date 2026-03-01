import { memo, useCallback, useRef } from "react";
import { NodeResizer } from "reactflow";
import type { NodeProps } from "reactflow";
import type { ZoneOnChart } from "@easy-charts/easycharts-types";
import { useThemeMode } from "../../contexts/ThemeModeContext";
import { NOTE_SWATCH, NOTE_COLORS } from "./EditoroMenuList";

export interface ZoneNodeData {
  zone: ZoneOnChart;
  editMode: boolean;
  onLabelChange: (id: string, label: string) => void;
  onSizeChange: (id: string, width: number, height: number) => void;
}

function hexToRgba(hex: string, opacity: number): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

function getZoneColor(color: string): string {
  const isPreset = NOTE_COLORS.some((c) => c.key === color);
  return isPreset ? (NOTE_SWATCH[color] ?? "#60a5fa") : color;
}

function ZoneNode({ data, selected }: NodeProps<ZoneNodeData>) {
  const { zone, editMode, onLabelChange, onSizeChange } = data;
  const { isDark } = useThemeMode();
  const inputRef = useRef<HTMLInputElement>(null);

  const borderColor = getZoneColor(zone.color);
  const fillBase = zone.fillColor ? getZoneColor(zone.fillColor) : borderColor;
  const fillColor =
    zone.fillOpacity === 0
      ? "transparent"
      : hexToRgba(fillBase, zone.fillOpacity);
  const borderRadius = zone.shape === "ellipse" ? "50%" : "8px";

  const labelColor = isDark ? "#e2e8f0" : "#1e293b";
  const labelShadow = isDark
    ? "0 1px 3px rgba(0,0,0,0.8)"
    : "0 1px 3px rgba(255,255,255,0.9)";

  const handleResizeEnd = useCallback(
    (_e: unknown, params: { width: number; height: number }) => {
      onSizeChange(zone.id, params.width, params.height);
    },
    [zone.id, onSizeChange]
  );

  const handleLabelChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onLabelChange(zone.id, e.target.value);
    },
    [zone.id, onLabelChange]
  );

  return (
    <div
      className="w-full h-full"
      style={{
        background: fillColor,
        border: `${zone.borderWidth}px ${zone.borderStyle} ${borderColor}`,
        borderRadius,
        boxShadow: selected ? `0 0 0 2px #6366f1` : "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {editMode && (
        <NodeResizer
          minWidth={100}
          minHeight={80}
          onResizeEnd={handleResizeEnd}
          lineStyle={{ borderColor: "#6366f1" }}
          handleStyle={{
            background: "#6366f1",
            border: "none",
            borderRadius: 2,
            width: 8,
            height: 8,
          }}
        />
      )}

      {/* Label */}
      {editMode ? (
        <input
          ref={inputRef}
          type="text"
          value={zone.label}
          onChange={handleLabelChange}
          onKeyDown={(e) => e.stopPropagation()}
          placeholder="Zone label…"
          className="bg-transparent outline-none text-center text-sm font-semibold w-full px-4"
          style={{
            color: labelColor,
            textShadow: labelShadow,
            caretColor: labelColor,
          }}
        />
      ) : zone.label ? (
        <span
          className="text-sm font-semibold text-center px-4 select-none pointer-events-none"
          style={{ color: labelColor, textShadow: labelShadow }}
        >
          {zone.label}
        </span>
      ) : null}
    </div>
  );
}

export default memo(ZoneNode);
