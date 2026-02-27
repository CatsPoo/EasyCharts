import { useReactFlow, type Edge } from "reactflow";
import { EditorMenuListKeys } from "./enums/EditorMenuListKeys.enum";
import { useCallback, useState } from "react";
import { useThemeMode } from "../../contexts/ThemeModeContext";

export const NOTE_COLORS: { key: string; light: string; dark: string; label: string }[] = [
  { key: "yellow", light: "#fef9c3", dark: "#3d3822", label: "Yellow" },
  { key: "orange", light: "#fed7aa", dark: "#3d2010", label: "Orange" },
  { key: "pink",   light: "#fce7f3", dark: "#3d1a2d", label: "Pink"   },
  { key: "blue",   light: "#dbeafe", dark: "#1a2a3d", label: "Blue"   },
  { key: "green",  light: "#dcfce7", dark: "#1a3d25", label: "Green"  },
  { key: "purple", light: "#ede9fe", dark: "#2a1a3d", label: "Purple" },
  { key: "gray",   light: "#f1f5f9", dark: "#1e293b", label: "Gray"   },
];

interface EditorMenuListProps {
  kind: CtxKind;
  onAction: (a: EditorMenuListKeys) => void;
  onNoteColorChange?: (colorKey: string) => void;
  isUndoEnabled: boolean;
  isRedoEnabled: boolean;
  canConnectPaired?: boolean;
}

const MOVE_SUBMENU_ITEMS = [
  { key: EditorMenuListKeys.MOVE_HANDLE_TO_TOP,    label: "Top"    },
  { key: EditorMenuListKeys.MOVE_HANDLE_TO_RIGHT,  label: "Right"  },
  { key: EditorMenuListKeys.MOVE_HANDLE_TO_BOTTOM, label: "Bottom" },
  { key: EditorMenuListKeys.MOVE_HANDLE_TO_LEFT,   label: "Left"   },
];

export default function EditorMenuList({
  kind,
  onAction,
  onNoteColorChange,
  isRedoEnabled,
  isUndoEnabled,
  canConnectPaired = false,
}: EditorMenuListProps) {
  const [moveSubmenuOpen, setMoveSubmenuOpen] = useState(false);
  const [colorSubmenuOpen, setColorSubmenuOpen] = useState(false);
  const { isDark } = useThemeMode();

  const itemsByKind: Record<CtxKind, Array<{ key: EditorMenuListKeys; label: string }>> = {
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
    note: [
      { key: EditorMenuListKeys.DELETE_NOTE, label: "Delete Note" },
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
    "absolute left-full top-0 rounded-md border shadow-lg py-1 z-[10000]",
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

      {/* Move-to submenu (handle) */}
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
            <ul className={submenuClass + " min-w-[100px]"}>
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

      {/* Color submenu (note) */}
      {kind === "note" && (
        <li
          className="relative"
          onMouseEnter={() => setColorSubmenuOpen(true)}
          onMouseLeave={() => setColorSubmenuOpen(false)}
        >
          <button className={`${btnClass} flex justify-between items-center`}>
            Color...
            <span className="ml-2 text-slate-400">›</span>
          </button>
          {colorSubmenuOpen && (
            <div
              className={[
                "absolute left-full top-0 rounded-md border shadow-lg z-[10000] p-2",
                isDark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200",
              ].join(" ")}
            >
              <div className="grid grid-cols-4 gap-1.5">
                {NOTE_COLORS.map((c) => (
                  <button
                    key={c.key}
                    title={c.label}
                    onClick={() => onNoteColorChange?.(c.key)}
                    className={[
                      "w-6 h-6 rounded border hover:scale-110 transition-transform",
                      isDark ? "border-slate-600" : "border-slate-300",
                    ].join(" ")}
                    style={{ background: isDark ? c.dark : c.light }}
                  />
                ))}
              </div>
            </div>
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
