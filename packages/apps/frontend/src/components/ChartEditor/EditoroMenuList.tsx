import { useReactFlow, type Edge } from "reactflow";
import { EditorMenuListKeys } from "./enums/EditorMenuListKeys.enum";
import { useCallback, useState } from "react";
import { useThemeMode } from "../../contexts/ThemeModeContext";


interface EditorMenuListProps  {
  kind: CtxKind;
  onAction: (a: EditorMenuListKeys) => void;
  isUndoEnabled : boolean,
  isRedoEnabled : boolean,
  canConnectPaired?: boolean,
}

const MOVE_SUBMENU_ITEMS = [
  { key: EditorMenuListKeys.MOVE_HANDLE_TO_TOP, label: "Top" },
  { key: EditorMenuListKeys.MOVE_HANDLE_TO_RIGHT, label: "Right" },
  { key: EditorMenuListKeys.MOVE_HANDLE_TO_BOTTOM, label: "Bottom" },
  { key: EditorMenuListKeys.MOVE_HANDLE_TO_LEFT, label: "Left" },
];

export default function EditorMenuList({
  kind,
  onAction,
  isRedoEnabled,
  isUndoEnabled,
  canConnectPaired = false,
}: EditorMenuListProps) {
  const [moveSubmenuOpen, setMoveSubmenuOpen] = useState(false);
  const { isDark } = useThemeMode();

  const itemsByKind: Record<
    CtxKind,
    Array<{ key: EditorMenuListKeys; label: string }>
  > = {
    common: [
      { key: EditorMenuListKeys.UNDO, label: "Undo" },
      { key: EditorMenuListKeys.REDO, label: "Redo" },
    ],
    pane: [
      { key: EditorMenuListKeys.Add_DDEVICE_TO_CHART, label: "Add device here" },
      { key: EditorMenuListKeys.FIT, label: "Fit view" },
    ],
    node: [
      { key: EditorMenuListKeys.EDIT_DEVICE, label: "Edit Device" },
      { key: EditorMenuListKeys.EDIT_PORTS, label: "Edit Ports..." },
      { key: EditorMenuListKeys.REMOVE_DEVICE_FROM_CHART, label: "Remove Device From Chart" },
      { key: EditorMenuListKeys.DELETE_DEVICE, label: "Delete Device" },
    ],
    edge: [
      { key: EditorMenuListKeys.EDIT_LINE, label: "Edit Line" },
      { key: EditorMenuListKeys.REMOVE_LINE_FROM_CHART, label: "Remove Line From Chart" },
      { key: EditorMenuListKeys.DELETE_LINE, label: "Delete Line" },
      { key: EditorMenuListKeys.BOND_LINES, label: "Bond Lines" },
    ],
    handle: [
      { key: EditorMenuListKeys.EDIT_PORTS, label: "Edit Ports..." },
      { key: EditorMenuListKeys.EDIT_PORT, label: "Edit Port" },
      { key: EditorMenuListKeys.REMOVE_PORT, label: "Remove from Chart" },
      { key: EditorMenuListKeys.DELETE_PORT, label: "Delete Port" },
    ],
  };

  const rf = useReactFlow();

  const getSelectedEdges = useCallback((): Edge[] => {
    return rf.getEdges().filter((e) => e.selected);
  }, [rf]);

  const btnClass = [
    "w-full px-3 py-1.5 text-left text-sm",
    isDark
      ? "hover:bg-slate-700 disabled:hover:bg-transparent"
      : "hover:bg-slate-100 disabled:hover:bg-transparent",
    "disabled:opacity-50 disabled:cursor-not-allowed",
  ].join(" ");

  const submenuClass = [
    "absolute left-full top-0 min-w-[100px] rounded-md border shadow-lg py-1 z-[10000]",
    isDark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200",
  ].join(" ");

  const dividerClass = [
    "my-1 border-t",
    isDark ? "border-slate-700" : "border-slate-200",
  ].join(" ");

  const mainItems = [
    ...(itemsByKind[kind] ?? []),
    ...(canConnectPaired && (kind === "handle" || kind === "node")
      ? [{ key: EditorMenuListKeys.CONNECT_PAIRED_PORTS, label: "Connect Paired Ports" }]
      : []),
  ];
  const commonItems = itemsByKind["common"];

  return (
    <ul className="py-1">
      {mainItems.map((it) => (
        <li key={it.key + kind}>
          <button
            className={btnClass}
            onClick={() => onAction(it.key)}
            disabled={
              it.key === EditorMenuListKeys.BOND_LINES
                ? getSelectedEdges().length < 2
                : false
            }
          >
            {it.label}
          </button>
        </li>
      ))}

      {kind === "handle" && (
        <li
          className="relative"
          onMouseEnter={() => setMoveSubmenuOpen(true)}
          onMouseLeave={() => setMoveSubmenuOpen(false)}
        >
          <button className={`${btnClass} flex justify-between items-center`}>
            Move to...
            <span className="ml-2 text-slate-400">›</span>
          </button>
          {moveSubmenuOpen && (
            <ul className={submenuClass}>
              {MOVE_SUBMENU_ITEMS.map((sub) => (
                <li key={sub.key}>
                  <button className={btnClass} onClick={() => onAction(sub.key)}>
                    {sub.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </li>
      )}

      <li><hr className={dividerClass} /></li>

      {commonItems.map((it) => (
        <li key={it.key + kind}>
          <button
            className={btnClass}
            onClick={() => onAction(it.key)}
            disabled={
              it.key === EditorMenuListKeys.UNDO
                ? !isUndoEnabled
                : it.key === EditorMenuListKeys.REDO
                ? !isRedoEnabled
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
