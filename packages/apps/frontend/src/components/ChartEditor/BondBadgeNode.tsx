import type { Bond } from "@easy-charts/easycharts-types";
import { useEffect, useMemo, useState } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import { Orientation } from "./enums/BondBridgeNode.enum";

export interface BondBridgeNodeData {
  bond:Bond;
orientation:Orientation; // "lr" => tall oval with L/R handles; "tb" => wide oval with T/B handles
  onRename?: (txt: string) => void;
}

export function BondBridgeNode({ id, data, selected }: NodeProps<BondBridgeNodeData>) {
  const { bond,orientation  } = data;
  const {name,membersLines} = bond
  const [text, setText] = useState(name ?? "Bond");

  useEffect(() => setText(name ?? "Bond"), [name]);

  const count = useMemo(()=>{
    return membersLines.length
  },[membersLines.length])


  // size: wide if TB, tall if LR; grow with member count
  const baseW = 84, baseH = 48, step = 14;
  const width  = orientation === Orientation.TopToBottom ? Math.max(baseW, baseW + step * (count - 1)) : 52;
  const height = orientation === Orientation.LeftToright ? Math.max(baseH, baseH + step * (count - 1)) : 52;

  // even spacing helper: returns percentage for slot i (0..count-1)
  const slotPct = (i: number, n: number) => ((i + 1) / (n + 1)) * 100;

  return (
    <div
      className="nodrag nopan"
      style={{
        width,
        height,
        borderRadius: 9999,
        background: "#ffffff",
        color: "#111827",
        border: selected ? "2px solid #2563eb" : "1px solid #cbd5e1",
        boxShadow: "0 6px 24px rgba(0,0,0,.12)",
        display: "grid",
        placeItems: "center",
        cursor: "move",
        userSelect: "none",
        padding: 6,
      }}
      title="Drag to reposition. Double-click text to edit."
    >
      {/* Handles */}
      {orientation === Orientation.LeftToright ? (
        <>
          {/* Left targets */}
          {Array.from({ length: count }).map((_, i) => (
            <Handle
              key={`L-${i}`}
              id={`${id}-L-${i}`}
              type="target"
              position={Position.Left}
              isConnectable={false}
              style={{ top: `${slotPct(i, count)}%` }}
            />
          ))}
          {/* Right sources */}
          {Array.from({ length: count }).map((_, i) => (
            <Handle
              key={`R-${i}`}
              id={`${id}-R-${i}`}
              type="source"
              position={Position.Right}
              isConnectable={false}
              style={{ top: `${slotPct(i, count)}%` }}
            />
          ))}
        </>
      ) : (
        <>
          {/* Top targets */}
          {Array.from({ length: count }).map((_, i) => (
            <Handle
              key={`T-${i}`}
              id={`${id}-T-${i}`}
              type="target"
              position={Position.Top}
              isConnectable={false}
              style={{ left: `${slotPct(i, count)}%` }}
            />
          ))}
          {/* Bottom sources */}
          {Array.from({ length: count }).map((_, i) => (
            <Handle
              key={`B-${i}`}
              id={`${id}-B-${i}`}
              type="source"
              position={Position.Bottom}
              isConnectable={false}
              style={{ left: `${slotPct(i, count)}%` }}
            />
          ))}
        </>
      )}

      {/* Editable label */}
      <div
        contentEditable
        suppressContentEditableWarning
        onDoubleClick={(e) => e.stopPropagation()}
        onInput={(e) => setText((e.target as HTMLDivElement).innerText)}
        onBlur={() => data?.onRename?.(text.trim())}
        style={{
          outline: "none",
          fontSize: 12,
          lineHeight: 1.1,
          padding: "2px 6px",
          maxWidth: width - 16,
          maxHeight: height - 16,
          overflow: "hidden",
          whiteSpace: "nowrap",
          textOverflow: "ellipsis",
          textAlign: "center",
        }}
      >
        {text || "Bond"}
      </div>
    </div>
  );
}

export default BondBridgeNode;
