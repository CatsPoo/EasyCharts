import { EditorMenuListKeys } from "./enums/EditorMenuListKeys.enum";

export default function EditorMenuList({
  kind,
  onAction,
}: {
  kind: CtxKind;
  onAction: (a: EditorMenuListKeys) => void;
}) {
  const itemsByKind: Record<CtxKind, Array<{ key: EditorMenuListKeys; label: string }>> = {
    pane: [
      { key: EditorMenuListKeys.Add_DDEVICE_TO_CHART, label: "Add device here" },
      { key: EditorMenuListKeys.FIT, label: "Fit view" },
    ],
    node: [
      { key: EditorMenuListKeys.EDIT_DEVICE, label: "Edit Device" },
      { key: EditorMenuListKeys.REMOVE_DEVICE_FROM_CHART, label: "Remove Device From Chart" },
      { key: EditorMenuListKeys.DELETE_DEVICE, label: "Delete Device" },
    ],
    edge: [
      { key: EditorMenuListKeys.EDIT_LINE, label: "Edit Line" },
      { key: EditorMenuListKeys.REMOVE_LINE_FROM_CHART, label: "Remove Line From Chart" },
      { key: EditorMenuListKeys.DELETE_LINE, label: "Delete Line" },
    ],
    handle: [
      { key: EditorMenuListKeys.EDIT_PORT, label: "Edit Port" },
      { key: EditorMenuListKeys.REMOVE_PORT, label: "Remove Port" },
    ],
  };

  const items = itemsByKind[kind] ?? [];
  return (
    <ul className="py-1">
      {items.map((it) => (
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
