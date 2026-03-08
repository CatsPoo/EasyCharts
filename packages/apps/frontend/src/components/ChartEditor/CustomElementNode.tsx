import { Handle, Position, type NodeProps } from "reactflow";
import type { CustomElementOnChart } from "@easy-charts/easycharts-types";
import ImageNotSupportedIcon from "@mui/icons-material/ImageNotSupported";

interface CustomElementNodeData {
  ceOnChart: CustomElementOnChart;
  editMode: boolean;
}

const HANDLE_STYLE: React.CSSProperties = { width: 10, height: 10 };

export default function CustomElementNode({ data }: NodeProps<CustomElementNodeData>) {
  const { ceOnChart } = data;
  const { customElement, freeText } = ceOnChart;
  const imageUrl = customElement?.imageUrl;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", userSelect: "none" }}>
      {/* Source handles */}
      <Handle type="source" position={Position.Top}    id="src-top"    style={{ ...HANDLE_STYLE, top: -5 }} />
      <Handle type="source" position={Position.Right}  id="src-right"  style={{ ...HANDLE_STYLE, right: -5 }} />
      <Handle type="source" position={Position.Bottom} id="src-bottom" style={{ ...HANDLE_STYLE, bottom: -5 }} />
      <Handle type="source" position={Position.Left}   id="src-left"   style={{ ...HANDLE_STYLE, left: -5 }} />

      {/* Target handles (invisible, same positions) */}
      <Handle type="target" position={Position.Top}    id="tgt-top"    style={{ ...HANDLE_STYLE, top: -5, opacity: 0 }} />
      <Handle type="target" position={Position.Right}  id="tgt-right"  style={{ ...HANDLE_STYLE, right: -5, opacity: 0 }} />
      <Handle type="target" position={Position.Bottom} id="tgt-bottom" style={{ ...HANDLE_STYLE, bottom: -5, opacity: 0 }} />
      <Handle type="target" position={Position.Left}   id="tgt-left"   style={{ ...HANDLE_STYLE, left: -5, opacity: 0 }} />

      {/* Name above */}
      <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 2, maxWidth: 120, textAlign: "center", wordBreak: "break-word" }}>
        {customElement?.name}
      </div>

      {/* Image */}
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={customElement?.name}
          style={{ width: "100%", height: "100%", objectFit: "contain", background: "transparent" }}
          draggable={false}
        />
      ) : (
        <ImageNotSupportedIcon style={{ fontSize: 48, opacity: 0.4 }} />
      )}

      {/* Free text below */}
      {freeText && (
        <div style={{ fontSize: 10, marginTop: 2, maxWidth: 120, textAlign: "center", wordBreak: "break-word", opacity: 0.75 }}>
          {freeText}
        </div>
      )}
    </div>
  );
}
