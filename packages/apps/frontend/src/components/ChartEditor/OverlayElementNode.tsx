import { memo, useCallback } from "react";
import { Handle, Position, NodeResizer } from "reactflow";
import type { NodeProps } from "reactflow";
import type { OverlayElementOnChart } from "@easy-charts/easycharts-types";
import { useThemeMode } from "../../contexts/ThemeModeContext";
import ImageNotSupportedIcon from "@mui/icons-material/ImageNotSupported";

export interface OverlayElementNodeData {
  overlayElementOnChart: OverlayElementOnChart;
  editMode: boolean;
  onRemove: (instanceId: string) => void;
  onSizeChange: (instanceId: string, width: number, height: number) => void;
}

const HANDLE_STYLE = { width: 10, height: 10, borderRadius: 5 };

// Cloud shape path (normalised to 24×16 viewBox, fills the node via preserveAspectRatio="none")
const CLOUD_PATH =
  "M19.35 6.04A7.49 7.49 0 0 0 12 0C9.11 0 6.6 1.64 5.35 4.04A5.994 5.994 0 0 0 0 10c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z";

function OverlayElementNode({ data, selected }: NodeProps<OverlayElementNodeData>) {
  const { overlayElementOnChart, editMode, onRemove, onSizeChange } = data;
  const { overlayElement, freeText } = overlayElementOnChart;
  const { isDark } = useThemeMode();

  const handleResizeEnd = useCallback(
    (_e: unknown, params: { width: number; height: number }) => {
      onSizeChange(overlayElementOnChart.id, params.width, params.height);
    },
    [overlayElementOnChart.id, onSizeChange]
  );

  // System elements (e.g. Cloud) render as cloud shape; user elements render as image cards
  const isSystem = overlayElement.isSystem;

  // Cloud colours
  const fill   = isDark ? "#0c2340" : "#eef2ff";
  const stroke = selected ? "#a78bfa" : isDark ? "#38bdf8" : "#6366f1";
  const textColor = isDark ? "#93c5fd" : "#4338ca";

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      {editMode && (
        <NodeResizer
          minWidth={isSystem ? 140 : 60}
          minHeight={isSystem ? 80 : 60}
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

      {/* ── Cloud (system element) rendering ── */}
      {isSystem && (
        <>
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

          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              paddingTop: "22%",
              paddingLeft: 10,
              paddingRight: 10,
              gap: 3,
              pointerEvents: "none",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 5, maxWidth: "100%", pointerEvents: "auto" }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill={textColor} style={{ flexShrink: 0 }}>
                <path d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
              </svg>
              {/* freeText holds the user-given instance name; fall back to template name */}
              <span style={{ color: textColor, fontWeight: 700, fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {freeText || overlayElement.name}
              </span>
              {editMode && (
                <button
                  style={{ color: textColor, background: "transparent", border: "none", cursor: "pointer", padding: "0 2px", fontSize: 10, lineHeight: 1, flexShrink: 0, pointerEvents: "auto" }}
                  onClick={(e) => { e.stopPropagation(); onRemove(overlayElementOnChart.id); }}
                  title="Remove from chart"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── Custom element (user-created) rendering ── */}
      {!isSystem && (
        <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", userSelect: "none", gap: 2 }}>
          <div style={{ fontSize: 11, fontWeight: 600, maxWidth: "100%", textAlign: "center", wordBreak: "break-word", paddingInline: 4 }}>
            {overlayElement.name}
          </div>
          {overlayElement.imageUrl ? (
            <img
              src={overlayElement.imageUrl}
              alt={overlayElement.name}
              style={{ width: "100%", flex: 1, objectFit: "contain", background: "transparent", minHeight: 0 }}
              draggable={false}
            />
          ) : (
            <ImageNotSupportedIcon style={{ fontSize: 48, opacity: 0.4 }} />
          )}
          {freeText && (
            <div style={{ fontSize: 10, maxWidth: "100%", textAlign: "center", wordBreak: "break-word", opacity: 0.75, paddingInline: 4 }}>
              {freeText}
            </div>
          )}
        </div>
      )}

      {/* React Flow handles */}
      <Handle type="source" position={Position.Left}   id="src-left"   style={HANDLE_STYLE} />
      <Handle type="source" position={Position.Right}  id="src-right"  style={HANDLE_STYLE} />
      <Handle type="source" position={Position.Top}    id="src-top"    style={HANDLE_STYLE} />
      <Handle type="source" position={Position.Bottom} id="src-bottom" style={HANDLE_STYLE} />
      <Handle type="target" position={Position.Left}   id="left"   style={{ ...HANDLE_STYLE, opacity: 0 }} />
      <Handle type="target" position={Position.Right}  id="right"  style={{ ...HANDLE_STYLE, opacity: 0 }} />
      <Handle type="target" position={Position.Top}    id="top"    style={{ ...HANDLE_STYLE, opacity: 0 }} />
      <Handle type="target" position={Position.Bottom} id="bottom" style={{ ...HANDLE_STYLE, opacity: 0 }} />
    </div>
  );
}

export default memo(OverlayElementNode);
