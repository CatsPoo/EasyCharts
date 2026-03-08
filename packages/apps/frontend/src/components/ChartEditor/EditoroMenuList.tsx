import { useReactFlow, type Edge } from "reactflow";
import { EditorMenuListKeys } from "./enums/EditorMenuListKeys.enum";
import { useCallback, useEffect, useRef, useState } from "react";
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

// Vibrant swatch dots shown next to each label in the color list
export const NOTE_SWATCH: Record<string, string> = {
  yellow: "#fde047",
  orange: "#fb923c",
  pink:   "#f472b6",
  blue:   "#60a5fa",
  green:  "#4ade80",
  purple: "#a78bfa",
  gray:   "#94a3b8",
};

export interface CableTypeOption {
  id: string;
  name: string;
  defaultColor: string;
}

interface EditorMenuListProps {
  kind: CtxKind;
  onAction: (a: EditorMenuListKeys) => void;
  onNoteColorChange?: (colorKey: string) => void;
  onCableTypeSelect?: (cableType: CableTypeOption) => void;
  onCreateCableType?: () => void;
  isUndoEnabled: boolean;
  isRedoEnabled: boolean;
  canConnectPaired?: boolean;
  availableCableTypes?: CableTypeOption[];
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
  onCableTypeSelect,
  onCreateCableType,
  isRedoEnabled,
  isUndoEnabled,
  canConnectPaired = false,
  availableCableTypes = [],
}: EditorMenuListProps) {
  const [moveSubmenuOpen, setMoveSubmenuOpen] = useState(false);
  const [colorSubmenuOpen, setColorSubmenuOpen] = useState(false);
  const [cableSubmenuOpen, setCableSubmenuOpen] = useState(false);
  const { isDark } = useThemeMode();
  const colorMenuRef = useRef<HTMLLIElement>(null);

  // Close color submenu on outside click
  useEffect(() => {
    if (!colorSubmenuOpen) return;
    function handleOutside(e: MouseEvent) {
      if (colorMenuRef.current && !colorMenuRef.current.contains(e.target as Node)) {
        setColorSubmenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [colorSubmenuOpen]);

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
    bond: [
      { key: EditorMenuListKeys.EDIT_BOND, label: "Edit" },
      { key: EditorMenuListKeys.UNBOND_PORTS, label: "Unbond Ports" },
      { key: EditorMenuListKeys.REMOVE_BOND_FROM_CHART, label: "Remove from Chart" },
    ],
    cloud: [
      { key: EditorMenuListKeys.EDIT_CLOUD, label: "Edit Cloud" },
      { key: EditorMenuListKeys.REMOVE_CLOUD_FROM_CHART, label: "Remove Cloud From Chart" },
      { key: EditorMenuListKeys.DELETE_CLOUD, label: "Delete Cloud" },
    ],
    zone: [
      { key: EditorMenuListKeys.EDIT_ZONE_STYLE, label: "Edit Style..." },
      { key: EditorMenuListKeys.DELETE_ZONE, label: "Delete Zone" },
    ],
    customElement: [
      { key: EditorMenuListKeys.EDIT_CUSTOM_ELEMENT_TEXT, label: "Edit Text..." },
      { key: EditorMenuListKeys.REMOVE_CUSTOM_ELEMENT_FROM_CHART, label: "Remove From Chart" },
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

      {/* Color submenu (note) — click-based so native color picker can open without closing the panel */}
      {kind === "note" && (
        <li ref={colorMenuRef} className="relative">
          <button
            className={`${btnClass} flex justify-between items-center`}
            onClick={() => setColorSubmenuOpen((v) => !v)}
          >
            Color...
            <span className="ml-2 text-slate-400">›</span>
          </button>

          {colorSubmenuOpen && (
            <ul
              className={[
                "absolute left-full top-0 rounded-md border shadow-lg py-1 z-[10000] min-w-[140px]",
                isDark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200",
              ].join(" ")}
            >
              {NOTE_COLORS.map((c) => (
                <li key={c.key}>
                  <button
                    className={`${btnClass} flex items-center gap-2`}
                    onClick={() => { onNoteColorChange?.(c.key); setColorSubmenuOpen(false); }}
                  >
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ background: NOTE_SWATCH[c.key] }}
                    />
                    {c.label}
                  </button>
                </li>
              ))}

              <li><hr className={dividerClass} /></li>

              <li>
                <button
                  className={`${btnClass} flex items-center gap-2`}
                  onClick={() => {
                    setColorSubmenuOpen(false);
                    onAction(EditorMenuListKeys.EDIT_NOTE_COLOR);
                  }}
                >
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{
                      background:
                        "conic-gradient(red, yellow, lime, cyan, blue, magenta, red)",
                    }}
                  />
                  Custom…
                </button>
              </li>
            </ul>
          )}
        </li>
      )}

      {/* Cable type submenu (edge) */}
      {kind === "edge" && (
        <li
          className="relative"
          onMouseEnter={() => setCableSubmenuOpen(true)}
          onMouseLeave={() => setCableSubmenuOpen(false)}
        >
          <button className={`${btnClass} flex justify-between items-center`}>
            Cable Type...
            <span className="ml-2 text-slate-400">›</span>
          </button>
          {cableSubmenuOpen && (
            <ul className={submenuClass + " min-w-[160px]"}>
              {availableCableTypes.map((ct) => (
                <li key={ct.id}>
                  <button
                    className={`${btnClass} flex items-center gap-2`}
                    onClick={() => { onCableTypeSelect?.(ct); setCableSubmenuOpen(false); }}
                  >
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: ct.defaultColor }} />
                    {ct.name}
                  </button>
                </li>
              ))}
              {availableCableTypes.length > 0 && <li><hr className={dividerClass} /></li>}
              <li>
                <button
                  className={btnClass}
                  onClick={() => { onAction(EditorMenuListKeys.SET_CABLE_NONE); setCableSubmenuOpen(false); }}
                >
                  None
                </button>
              </li>
              <li><hr className={dividerClass} /></li>
              <li>
                <button
                  className={`${btnClass} flex items-center gap-2`}
                  onClick={() => { onCreateCableType?.(); setCableSubmenuOpen(false); }}
                >
                  + Create new type
                </button>
              </li>
            </ul>
          )}
        </li>
      )}

      {/* Custom line color (edge) */}
      {kind === "edge" && (
        <li>
          <button
            className={`${btnClass} flex items-center gap-2`}
            onClick={() => onAction(EditorMenuListKeys.SET_LINE_COLOR)}
          >
            <span
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ background: "conic-gradient(red, yellow, lime, cyan, blue, magenta, red)" }}
            />
            Custom Color...
          </button>
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
