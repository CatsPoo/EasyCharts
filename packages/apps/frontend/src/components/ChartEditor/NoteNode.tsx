import { memo, useCallback } from "react";
import { NodeResizer } from "reactflow";
import type { NodeProps } from "reactflow";
import type { NoteOnChart } from "@easy-charts/easycharts-types";
import { useThemeMode } from "../../contexts/ThemeModeContext";
import { NOTE_COLORS } from "./EditoroMenuList";

export interface NoteNodeData {
  note: NoteOnChart;
  editMode: boolean;
  onContentChange: (id: string, content: string) => void;
  onSizeChange: (id: string, width: number, height: number) => void;
}

// Derived accent colors per palette entry (header bar / border / icon)
const ACCENT: Record<string, { headerLight: string; headerDark: string; borderLight: string; borderDark: string; iconLight: string; iconDark: string }> = {
  yellow: { headerLight: "#fde047", headerDark: "#4a4420", borderLight: "#fde047", borderDark: "#6b6430", iconLight: "#854d0e", iconDark: "#b5a84e" },
  orange: { headerLight: "#fb923c", headerDark: "#6b2d10", borderLight: "#fb923c", borderDark: "#7a3d1a", iconLight: "#7c2d12", iconDark: "#d97706" },
  pink:   { headerLight: "#f9a8d4", headerDark: "#6b1a3d", borderLight: "#f9a8d4", borderDark: "#7a1a4a", iconLight: "#9d174d", iconDark: "#ec4899" },
  blue:   { headerLight: "#93c5fd", headerDark: "#1a3a6b", borderLight: "#93c5fd", borderDark: "#1a3a7a", iconLight: "#1e40af", iconDark: "#60a5fa" },
  green:  { headerLight: "#86efac", headerDark: "#1a4a2a", borderLight: "#86efac", borderDark: "#1a5a30", iconLight: "#166534", iconDark: "#4ade80" },
  purple: { headerLight: "#c4b5fd", headerDark: "#3a1a6b", borderLight: "#c4b5fd", borderDark: "#4a1a7a", iconLight: "#6b21a8", iconDark: "#a78bfa" },
  gray:   { headerLight: "#cbd5e1", headerDark: "#334155", borderLight: "#cbd5e1", borderDark: "#475569", iconLight: "#475569", iconDark: "#94a3b8" },
};

function NoteNode({ data, selected }: NodeProps<NoteNodeData>) {
  const { note, editMode, onContentChange, onSizeChange } = data;
  const { isDark } = useThemeMode();

  const colorKey = note.color ?? "yellow";
  const palette = NOTE_COLORS.find((c) => c.key === colorKey) ?? NOTE_COLORS[0];
  const accent = ACCENT[colorKey] ?? ACCENT["yellow"];

  const bg = isDark ? palette.dark : palette.light;
  const border = isDark ? accent.borderDark : accent.borderLight;
  const headerBg = isDark ? accent.headerDark : accent.headerLight;
  const iconColor = isDark ? accent.iconDark : accent.iconLight;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onContentChange(note.id, e.target.value);
    },
    [note.id, onContentChange]
  );

  const handleResizeEnd = useCallback(
    (_e: unknown, params: { width: number; height: number }) => {
      onSizeChange(note.id, params.width, params.height);
    },
    [note.id, onSizeChange]
  );

  return (
    <div
      className="w-full h-full flex flex-col rounded-md overflow-hidden"
      style={{
        boxShadow: selected
          ? "0 0 0 2px #6366f1"
          : isDark
          ? "2px 2px 6px rgba(0,0,0,0.4)"
          : "2px 2px 6px rgba(0,0,0,0.15)",
        background: bg,
        border: `1px solid ${border}`,
      }}
    >
      {editMode && (
        <NodeResizer
          minWidth={120}
          minHeight={80}
          onResizeEnd={handleResizeEnd}
          lineStyle={{ borderColor: "#6366f1" }}
          handleStyle={{
            background: "#6366f1",
            border: "none",
            borderRadius: 2,
            width: 8,
            height: 8,
          }}
        />
      )}

      {/* Header bar */}
      <div
        className="flex items-center gap-1 px-2 py-1 flex-none select-none"
        style={{
          background: headerBg,
          borderBottom: `1px solid ${border}`,
        }}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="currentColor"
          style={{ color: iconColor, flexShrink: 0 }}
        >
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14l4-4h12c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" />
        </svg>
        <span className="text-[10px] font-semibold" style={{ color: iconColor }}>
          Note
        </span>
      </div>

      {/* Content */}
      {editMode ? (
        <textarea
          className="flex-1 w-full resize-none outline-none text-xs p-2 bg-transparent"
          style={{
            color: isDark ? "#e5e0b8" : "#1c1917",
            fontFamily: "inherit",
          }}
          value={note.content}
          onChange={handleChange}
          placeholder="Type your note here..."
          onKeyDown={(e) => e.stopPropagation()}
        />
      ) : (
        <div
          className="flex-1 overflow-auto text-xs p-2 whitespace-pre-wrap break-words"
          style={{ color: isDark ? "#e5e0b8" : "#1c1917" }}
        >
          {note.content || (
            <span style={{ color: isDark ? "#7a6f3a" : "#a8a082" }}>
              (empty note)
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default memo(NoteNode);
