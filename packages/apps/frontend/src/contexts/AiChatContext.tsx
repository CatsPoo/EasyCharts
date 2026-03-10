import { type Chart, type ChatChartAction, type CurrentPage, type UIAction } from "@easy-charts/easycharts-types";
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

interface AiChatContextValue {
  /** Chart the AI just created/edited — consumed by ChartsPage to auto-open the editor */
  pendingChartAction: ChatChartAction | null;
  setPendingChartAction: (action: ChatChartAction) => void;

  pendingUiAction: UIAction[];
  setPendingUiAction: (action: UIAction[]) => void;

  clearPendingChartAction: () => void;

  /** ID + name of the chart currently open in the editor — sent to the AI as context */
  currentEditorChartId: string | null;
  currentEditorChartName: string | null;
  setCurrentEditorChart: (id: string | null, name: string | null) => void;

  /** Whether the editor is in edit mode (not just open, but actively editable) */
  editorEditMode: boolean;
  setEditorEditMode: (editMode: boolean) => void;

  /** Which page the user is currently on — set by each page on mount */
  currentPage: CurrentPage | null;
  setCurrentPage: (page: CurrentPage | null) => void;

  currentChartStateOnEditor : Chart | null;
  setCurrentChartStateOnEditor : (chart:Chart) => void
  /** Whether the chat drawer is open */
  chatOpen: boolean;
  openChat: () => void;
  closeChat: () => void;
}

const AiChatContext = createContext<AiChatContextValue | null>(null);

const noop = () => undefined;

/** No-op fallback returned by useAiChat() when AI is disabled (provider not mounted) */
const AI_DISABLED_NOOP: AiChatContextValue = {
  pendingChartAction: null,
  setPendingChartAction: noop,
  clearPendingChartAction: noop,
  currentEditorChartId: null,
  currentEditorChartName: null,
  setCurrentEditorChart: noop,
  editorEditMode: false,
  setEditorEditMode: noop,
  currentPage: null,
  setCurrentPage: noop,
  chatOpen: false,
  openChat: noop,
  closeChat: noop,
  currentChartStateOnEditor :null,
  setCurrentChartStateOnEditor:noop,
  pendingUiAction:[],
  setPendingUiAction:noop
};

export function AiChatProvider({ children }: { children: ReactNode }) {
  const [pendingChartAction, setPendingChartActionState] = useState<ChatChartAction | null>(null);
  const [pendingUiAction, setPendingUiAction] = useState<UIAction[]>([]);
  const [currentEditorChartId, setCurrentEditorChartId] = useState<string | null>(null);
  const [currentEditorChartName, setCurrentEditorChartName] = useState<string | null>(null);
  const [editorEditMode, setEditorEditMode] = useState(false);
  const [currentChartStateOnEditor,setCurrentChartStateOnEditor] = useState<Chart | null>(null)
  const [currentPage, setCurrentPage] = useState<CurrentPage | null>(null);
  const [chatOpen, setChatOpen] = useState(false);

  const setPendingChartAction = useCallback((action: ChatChartAction) => {
    setPendingChartActionState(action);
  }, []);

  const clearPendingChartAction = useCallback(() => {
    setPendingChartActionState(null);
  }, []);

  const setCurrentEditorChart = useCallback((id: string | null, name: string | null) => {
    setCurrentEditorChartId(id);
    setCurrentEditorChartName(name);
  }, []);

  const openChat = useCallback(() => setChatOpen(true), []);
  const closeChat = useCallback(() => setChatOpen(false), []);

  return (
    <AiChatContext.Provider
      value={{
        pendingChartAction,
        setPendingChartAction,
        clearPendingChartAction,
        currentEditorChartId,
        currentEditorChartName,
        setCurrentEditorChart,
        editorEditMode,
        setEditorEditMode,
        currentPage,
        setCurrentPage,
        chatOpen,
        openChat,
        closeChat,
        currentChartStateOnEditor,
        setCurrentChartStateOnEditor,
        pendingUiAction,
        setPendingUiAction
      }}
    >
      {children}
    </AiChatContext.Provider>
  );
}

/**
 * Returns the AI chat context.
 * When AI is disabled (provider not mounted), returns safe no-ops instead of throwing —
 * so components like ChartsPage can always call this hook unconditionally.
 */
export function useAiChat(): AiChatContextValue {
  return useContext(AiChatContext) ?? AI_DISABLED_NOOP;
}
