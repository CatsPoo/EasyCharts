import type { Port, Side } from "@easy-charts/easycharts-types";
import type { SidesOffset } from "./interfaces/sidesOffset.interface";
import AddIcon from "@mui/icons-material/Add";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";


interface inlineEditorProps {
    pendingSide : Side | null,
    nextOffsetForSide:(side:Side) => SidesOffset,
    selectedPortId:string,
    setSelectedPortId : (id:string) => void,
    devicePorts : Port[],
    portsInUseIds:Set<string>,
    onInlineEditorPlusClick :(e:any) =>void,
    onInlineEditorCheckClick: (e:any) => void,
    cancelInlineEditor: ()=>void
}
export function InlineEditor({
  pendingSide,
  nextOffsetForSide,
  selectedPortId,
  setSelectedPortId,
  devicePorts,
  portsInUseIds,
  onInlineEditorPlusClick,
  onInlineEditorCheckClick,
  cancelInlineEditor,
}: inlineEditorProps) {
  if (!pendingSide) return null;

  const { value } = nextOffsetForSide(pendingSide);

  const iconBtn = [
    "inline-flex items-center justify-center w-7 h-7 rounded-md border shadow-sm",
    "transition-colors duration-150",
    // bg / border swap per theme
    "bg-white border-slate-300 hover:bg-slate-50 active:bg-slate-100",
    "dark:bg-slate-800 dark:border-slate-600 dark:hover:bg-slate-700 dark:active:bg-slate-700/90",
    // focus ring
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300",
    "dark:focus-visible:ring-slate-400",
    // disabled
    "disabled:opacity-40 disabled:cursor-not-allowed",
  ].join(" ");

  const styleFor = (side: Side) =>
    side === "left"
      ? { top: `${value}%`, left: -240, transform: "translateY(-50%)" }
      : side === "right"
      ? { top: `${value}%`, right: -240, transform: "translateY(-50%)" }
      : side === "top"
      ? { left: `${value}%`, top: -48, transform: "translateX(-50%)" }
      : { left: `${value}%`, bottom: -48, transform: "translateX(-50%)" };

  return (
    <div
      className={[
        "absolute z-10 flex items-center gap-2 rounded-md border shadow backdrop-blur",
        "px-2 py-1",
        "bg-white/95 border-slate-200",
        "dark:bg-slate-900/95 dark:border-slate-700",
      ].join(" ")}
      style={styleFor(pendingSide)}
      onMouseDown={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
    >
      <select
        className={[
          "block h-8 w-35  flex-shrink-0", // <-- width + no shrink
          "rounded-md px-2 text-xs shadow-sm",
          "border border-slate-300 bg-white text-slate-900",
          "focus:outline-none focus:ring-2 focus:ring-slate-300",
          "dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100",
          "dark:focus:ring-slate-400",
        ].join(" ")}
        value={selectedPortId}
        onChange={(e) => setSelectedPortId(e.target.value)}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <option value="" disabled>
          Choose a port…
        </option>
        {devicePorts
          .filter((p) => !portsInUseIds.has(p.id))
          .map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.type})
            </option>
          ))}
      </select>

      <button
        type="button"
        className={[
          "inline-flex items-center justify-center w-7 h-7 rounded-md border shadow-sm",
          "transition-colors duration-150",
          // bg / border swap per theme
          "bg-white border-slate-300 hover:bg-slate-50 active:bg-slate-100",
          "dark:bg-slate-800 dark:border-slate-600 dark:hover:bg-slate-700 dark:active:bg-slate-700/90",
          // focus ring
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300",
          "dark:focus-visible:ring-slate-400",
          // disabled
          "disabled:opacity-40 disabled:cursor-not-allowed",
          "text-indigo-600",
          " dark:text-indigo-400",
        ].join(" ")}
        title="Create new port"
        onClick={(e) => onInlineEditorPlusClick(e)}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <AddIcon fontSize="small" />
      </button>

      <button
        type="button"
        className={`${iconBtn} text-emerald-600 dark:text-emerald-400`}
        disabled={!selectedPortId}
        onClick={(e) => onInlineEditorCheckClick(e)}
        onMouseDown={(e) => e.stopPropagation()}
        title={selectedPortId ? "Confirm" : "Select a port first"}
      >
        <CheckIcon fontSize="small" />
      </button>

      <button
        type="button"
        className={`${iconBtn} text-rose-600 dark:text-rose-400`}
        onClick={(e) => {
          e.stopPropagation();
          cancelInlineEditor();
        }}
        onMouseDown={(e) => e.stopPropagation()}
        title="Cancel"
      >
        <CloseIcon fontSize="small" />
      </button>
    </div>
  );
}
