import { memo, useCallback } from "react";
import { NodeResizer } from "reactflow";
import type { NodeProps } from "reactflow";
import type { NoteOnChart } from "@easy-charts/easycharts-types";
import { useThemeMode } from "../../contexts/ThemeModeContext";

export interface NoteNodeData {
  note: NoteOnChart;
  editMode: boolean;
  onContentChange: (id: string, content: string) => void;
  onSizeChange: (id: string, width: number, height: number) => void;
}

function NoteNode({ data, selected }: NodeProps<NoteNodeData>) {
  const { note, editMode, onContentChange, onSizeChange } = data;
  const { isDark } = useThemeMode();
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
        background: isDark ? "#3d3822" : "#fef9c3",
        border: isDark ? "1px solid #6b6430" : "1px solid #fde047",
      }}
    >
      {editMode && (
        <NodeResizer
          minWidth={120}
          minHeight={80}
          onResizeEnd={handleResizeEnd}
          lineStyle={{ borderColor: isDark ? "#6366f1" : "#6366f1" }}
          handleStyle={{
            background: isDark ? "#6366f1" : "#6366f1",
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
          background: isDark ? "#4a4420" : "#fde047",
          borderBottom: isDark ? "1px solid #6b6430" : "1px solid #facc15",
        }}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="currentColor"
          style={{ color: isDark ? "#b5a84e" : "#854d0e", flexShrink: 0 }}
        >
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14l4-4h12c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" />
        </svg>
        <span
          className="text-[10px] font-semibold"
          style={{ color: isDark ? "#b5a84e" : "#854d0e" }}
        >
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
          // Prevent React Flow from treating keyboard events as canvas shortcuts
          onKeyDown={(e) => e.stopPropagation()}
        />
      ) : (
        <div
          className="flex-1 overflow-auto text-xs p-2 whitespace-pre-wrap break-words"
          style={{
            color: isDark ? "#e5e0b8" : "#1c1917",
          }}
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
