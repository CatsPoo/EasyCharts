import { memo, useCallback } from "react";
import { Handle, Position, NodeResizer } from "reactflow";
import type { NodeProps } from "reactflow";
import type { CloudOnChart } from "@easy-charts/easycharts-types";
import { useThemeMode } from "../../contexts/ThemeModeContext";

export interface CloudNodeData {
  cloudOnChart: CloudOnChart;
  editMode: boolean;
  onRemove: (cloudId: string) => void;
  onSizeChange: (cloudId: string, width: number, height: number) => void;
}

const handleStyle = { width: 10, height: 10, borderRadius: 5 };

// Material-design cloud path normalised to a 24×16 viewBox so it fills
// the node rectangle cleanly via preserveAspectRatio="none".
// Original icon viewBox is 24×24; the cloud lives at y=4–20, so we
// shift it up by 4 to sit at y=0–16.
const CLOUD_PATH =
  "M19.35 6.04A7.49 7.49 0 0 0 12 0C9.11 0 6.6 1.64 5.35 4.04A5.994 5.994 0 0 0 0 10c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z";

function CloudNode({ data, selected }: NodeProps<CloudNodeData>) {
  const { cloudOnChart, editMode, onRemove, onSizeChange } = data;
  const { isDark } = useThemeMode();

  const handleResizeEnd = useCallback(
    (_e: unknown, params: { width: number; height: number }) => {
      onSizeChange(cloudOnChart.cloudId, params.width, params.height);
    },
    [cloudOnChart.cloudId, onSizeChange]
  );

  const fill   = isDark ? "#0c2340" : "#eef2ff";
  const stroke = selected ? "#a78bfa" : isDark ? "#38bdf8" : "#6366f1";
  const textColor = isDark ? "#93c5fd" : "#4338ca";
  const subColor  = isDark ? "#7dd3fc" : "#6366f1";

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      {editMode && (
        <NodeResizer
          minWidth={140}
          minHeight={80}
          onResizeEnd={handleResizeEnd}
          lineStyle={{ borderColor: stroke }}
          handleStyle={{
            background: stroke,
            border: "none",
            borderRadius: 2,
            width: 8,
            height: 8,
          }}
        />
      )}

      {/* ── Cloud-shaped background ── */}
      <svg
        viewBox="0 0 24 16"
        preserveAspectRatio="none"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      >
        <path
          d={CLOUD_PATH}
          fill={fill}
          stroke={stroke}
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {/* ── Content ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          // nudge content down into the wider "body" of the cloud
          paddingTop: "22%",
          paddingLeft: 10,
          paddingRight: 10,
          gap: 3,
          pointerEvents: "none",
        }}
      >
        {/* Name row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            maxWidth: "100%",
            pointerEvents: "auto",
          }}
        >
          {/* Small cloud icon */}
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill={textColor}
            style={{ flexShrink: 0 }}
          >
            <path d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
          </svg>

          <span
            style={{
              color: textColor,
              fontWeight: 700,
              fontSize: 11,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {cloudOnChart.cloud.name}
          </span>

          {editMode && (
            <button
              style={{
                color: textColor,
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: "0 2px",
                fontSize: 10,
                lineHeight: 1,
                flexShrink: 0,
                pointerEvents: "auto",
              }}
              onClick={(e) => {
                e.stopPropagation();
                onRemove(cloudOnChart.cloudId);
              }}
              title="Remove cloud from chart"
            >
              ✕
            </button>
          )}
        </div>

        {/* Optional description */}
        {cloudOnChart.cloud.description && (
          <span
            style={{
              color: subColor,
              fontSize: 9,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: "80%",
              pointerEvents: "auto",
            }}
          >
            {cloudOnChart.cloud.description}
          </span>
        )}
      </div>

      {/* ── React Flow handles (target — device sources connect to these) ── */}
      <Handle type="target" position={Position.Left}   id="left"   style={handleStyle} />
      <Handle type="target" position={Position.Right}  id="right"  style={handleStyle} />
      <Handle type="target" position={Position.Top}    id="top"    style={handleStyle} />
      <Handle type="target" position={Position.Bottom} id="bottom" style={handleStyle} />
    </div>
  );
}

export default memo(CloudNode);
