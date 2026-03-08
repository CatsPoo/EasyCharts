import { memo } from "react";
import { Handle, Position } from "reactflow";
import type { NodeProps } from "reactflow";
import type { CustomElementOnChart } from "@easy-charts/easycharts-types";
import { useThemeMode } from "../../contexts/ThemeModeContext";

export interface CustomElementNodeData {
  item: CustomElementOnChart;
  editMode: boolean;
}

const handleStyle = { width: 10, height: 10, borderRadius: 5 };

function CustomElementNode({ data, selected }: NodeProps<CustomElementNodeData>) {
  const { item, editMode } = data;
  const { isDark } = useThemeMode();

  const borderColor = selected
    ? "#a78bfa"
    : isDark
    ? "#6366f1"
    : "#818cf8";

  const nameColor = isDark ? "#e0e7ff" : "#3730a3";
  const textColor = isDark ? "#a5b4fc" : "#4f46e5";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        padding: "4px 6px",
        background: "transparent",
        outline: selected ? `2px solid ${borderColor}` : "none",
        borderRadius: 6,
        minWidth: 80,
      }}
    >
      {/* Handles */}
      <Handle type="source" position={Position.Top}    id="top"    style={handleStyle} isConnectable={editMode} />
      <Handle type="source" position={Position.Right}  id="right"  style={handleStyle} isConnectable={editMode} />
      <Handle type="source" position={Position.Bottom} id="bottom" style={handleStyle} isConnectable={editMode} />
      <Handle type="source" position={Position.Left}   id="left"   style={handleStyle} isConnectable={editMode} />
      <Handle type="target" position={Position.Top}    id="top-t"    style={{ ...handleStyle, opacity: 0 }} isConnectable={editMode} />
      <Handle type="target" position={Position.Right}  id="right-t"  style={{ ...handleStyle, opacity: 0 }} isConnectable={editMode} />
      <Handle type="target" position={Position.Bottom} id="bottom-t" style={{ ...handleStyle, opacity: 0 }} isConnectable={editMode} />
      <Handle type="target" position={Position.Left}   id="left-t"   style={{ ...handleStyle, opacity: 0 }} isConnectable={editMode} />

      {/* Name (above image) */}
      <span
        style={{
          color: nameColor,
          fontWeight: 700,
          fontSize: 11,
          textAlign: "center",
          maxWidth: 120,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {item.customElement.name}
      </span>

      {/* Image (no background) */}
      {item.customElement.imageUrl ? (
        <img
          src={item.customElement.imageUrl}
          alt={item.customElement.name}
          draggable={false}
          style={{
            width: "100%",
            height: "calc(100% - 48px)",
            objectFit: "contain",
            display: "block",
            minHeight: 40,
          }}
        />
      ) : (
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 8,
            background: isDark ? "#312e81" : "#e0e7ff",
            border: `2px dashed ${borderColor}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill={borderColor}>
            <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
          </svg>
        </div>
      )}

      {/* Free text (below image) */}
      {item.freeText && (
        <span
          style={{
            color: textColor,
            fontSize: 10,
            textAlign: "center",
            maxWidth: 120,
            wordBreak: "break-word",
            whiteSpace: "pre-wrap",
          }}
        >
          {item.freeText}
        </span>
      )}
    </div>
  );
}

export default memo(CustomElementNode);
