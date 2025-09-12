export default function MenuList({ kind, onAction }: { kind: CtxKind; onAction: (a: string) => void }) {
  const itemsByKind: Record<CtxKind, Array<{ key: string; label: string }>> = {
    pane:   [{ key: 'add_here', label: 'Add device here' }, { key: 'fit', label: 'Fit view' }],
    node:   [{ key: 'edit_node', label: 'Edit node' }, { key: 'delete_node', label: 'Delete node' }],
    edge:   [{ key: 'delete_edge', label: 'Delete edge' }, { key: 'toggle_type', label: 'Toggle type' }],
    handle: [{ key: 'remove_handle', label: 'Remove handle' }, { key: 'make_source', label: 'Mark as source' }, { key: 'make_target', label: 'Mark as target' }],
  };

  const items = itemsByKind[kind] ?? [];
  return (
    <ul className="py-1">
      {items.map(it => (
        <li key={it.key}>
          <button
            className="w-full px-3 py-1.5 text-left text-sm hover:bg-slate-100"
            onClick={() => onAction(it.key)}
          >
            {it.label}
          </button>
        </li>
      ))}
    </ul>
  );
}
