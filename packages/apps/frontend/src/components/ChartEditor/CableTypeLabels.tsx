import { EdgeLabelRenderer, useEdges, useNodes } from "reactflow";

/**
 * Renders cable type indicators as HTML badges at the center of each edge.
 * Separate from the user-defined label (shown via ReactFlow's label prop).
 * Must be rendered as a child of <ReactFlow>.
 */
export function CableTypeLabels() {
  const edges = useEdges();
  const nodes = useNodes();

  const nodeById = new Map(nodes.map((n) => [n.id, n]));

  const labels = edges.flatMap((edge) => {
    const cableType = edge.data?.cableType as string | undefined;
    if (!cableType) return [];

    const source = nodeById.get(edge.source);
    const target = nodeById.get(edge.target);
    if (!source || !target) return [];

    const sx = source.position.x + (source.width ?? 80) / 2;
    const sy = source.position.y + (source.height ?? 40) / 2;
    const tx = target.position.x + (target.width ?? 80) / 2;
    const ty = target.position.y + (target.height ?? 40) / 2;

    const x = (sx + tx) / 2;
    // Offset below center so it doesn't overlap the user label
    const y = (sy + ty) / 2 + 14;

    return [{ id: edge.id, x, y, cableType, hasUserLabel: !!edge.label }];
  });

  if (labels.length === 0) return null;

  return (
    <EdgeLabelRenderer>
      {labels.map(({ id, x, y, cableType }) => (
        <div
          key={id}
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`,
            pointerEvents: "none",
            fontSize: 10,
            background: "rgba(255,255,255,0.9)",
            border: "1px solid #bbb",
            borderRadius: 3,
            padding: "1px 5px",
            color: "#555",
            whiteSpace: "nowrap",
            zIndex: 10,
            lineHeight: "14px",
          }}
          className="nodrag nopan"
        >
          {cableType}
        </div>
      ))}
    </EdgeLabelRenderer>
  );
}
