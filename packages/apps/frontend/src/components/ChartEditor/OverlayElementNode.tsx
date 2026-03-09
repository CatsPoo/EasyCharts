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

  const stroke = selected ? "#a78bfa" : isDark ? "#38bdf8" : "#6366f1";

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      {editMode && (
        <NodeResizer
          minWidth={60}
          minHeight={60}
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

      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", userSelect: "none", gap: 2 }}>
        <div style={{ fontSize: 11, fontWeight: 600, maxWidth: "100%", textAlign: "center", wordBreak: "break-word", paddingInline: 4 }}>
          {freeText || overlayElement.name}
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
        {editMode && (
          <button
            style={{ position: "absolute", top: 2, right: 4, background: "transparent", border: "none", cursor: "pointer", fontSize: 10, lineHeight: 1, opacity: 0.6 }}
            onClick={(e) => { e.stopPropagation(); onRemove(overlayElementOnChart.id); }}
            title="Remove from chart"
          >
            ✕
          </button>
        )}
      </div>

      {/* React Flow handles — both connectable as source and target */}
      <Handle type="source" position={Position.Left}   id="left"   style={HANDLE_STYLE} isConnectableEnd={true} />
      <Handle type="source" position={Position.Right}  id="right"  style={HANDLE_STYLE} isConnectableEnd={true} />
      <Handle type="source" position={Position.Top}    id="top"    style={HANDLE_STYLE} isConnectableEnd={true} />
      <Handle type="source" position={Position.Bottom} id="bottom" style={HANDLE_STYLE} isConnectableEnd={true} />
    </div>
  );
}

export default memo(OverlayElementNode);
