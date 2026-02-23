import { useReactFlow, type Edge } from "reactflow";
import { EditorMenuListKeys } from "./enums/EditorMenuListKeys.enum";
import { useCallback } from "react";


interface EditorMenuListProps  {
  kind: CtxKind;
  onAction: (a: EditorMenuListKeys) => void;
  isUndoEnabled : boolean,
  isRedoEnabled : boolean,
  canConnectPaired?: boolean,
}

export default function EditorMenuList({
  kind,
  onAction,
  isRedoEnabled,
  isUndoEnabled,
  canConnectPaired = false,
}: EditorMenuListProps) {
  const itemsByKind: Record<
    CtxKind,
    Array<{ key: EditorMenuListKeys; label: string }>
  > = {
    common: [
      { key: EditorMenuListKeys.UNDO, label: "Undo" },
      { key: EditorMenuListKeys.REDO, label: "Redo" },
    ],
    pane: [
      {
        key: EditorMenuListKeys.Add_DDEVICE_TO_CHART,
        label: "Add device here",
      },
      { key: EditorMenuListKeys.FIT, label: "Fit view" },
    ],
    node: [
      { key: EditorMenuListKeys.EDIT_DEVICE, label: "Edit Device" },
      {
        key: EditorMenuListKeys.REMOVE_DEVICE_FROM_CHART,
        label: "Remove Device From Chart",
      },
      { key: EditorMenuListKeys.DELETE_DEVICE, label: "Delete Device" },
    ],
    edge: [
      { key: EditorMenuListKeys.EDIT_LINE, label: "Edit Line" },
      {
        key: EditorMenuListKeys.REMOVE_LINE_FROM_CHART,
        label: "Remove Line From Chart",
      },
      { key: EditorMenuListKeys.DELETE_LINE, label: "Delete Line" },
      { key: EditorMenuListKeys.BOND_LINES, label: "Bond Lines" },
    ],
    handle: [
      { key: EditorMenuListKeys.EDIT_PORT, label: "Edit Port" },
      { key: EditorMenuListKeys.REMOVE_PORT, label: "Remove Port" },
    ],
  };

  const rf = useReactFlow();

  /** All selected React Flow edges (split or plain) */
  const getSelectedEdges = useCallback((): Edge[] => {
    return rf.getEdges().filter((e) => e.selected);
  }, [rf]);

  const items = [
    ...(itemsByKind[kind] ?? []),
    ...(canConnectPaired && (kind === "handle" || kind === "node")
      ? [{ key: EditorMenuListKeys.CONNECT_PAIRED_PORTS, label: "Connect Paired Ports" }]
      : []),
    ...(itemsByKind["common"] ?? []),
  ];
  return (
    <ul className="py-1">
      {items.map((it) => (
        <li key={it.key + kind}>
          <button
            className="w-full px-3 py-1.5 text-left text-sm hover:bg-slate-100
             disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
            onClick={() => onAction(it.key)}
            disabled={
              it.key === EditorMenuListKeys.UNDO
                ? !isUndoEnabled
                : it.key === EditorMenuListKeys.REDO
                ? !isRedoEnabled
                : it.key === EditorMenuListKeys.BOND_LINES
                ? (getSelectedEdges().length < 2)
                : false
            }
          >
            {it.label}
          </button>
        </li>
      ))}
    </ul>
  );
}
