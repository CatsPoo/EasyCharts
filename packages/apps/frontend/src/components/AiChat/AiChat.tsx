import type { ChatChartAction, ChatMessage } from "@easy-charts/easycharts-types";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import CloseIcon from "@mui/icons-material/Close";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import {
  Alert,
  Box,
  Chip,
  Drawer,
  Fab,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAiChat } from "../../contexts/AiChatContext";
import { useAiChatMutation } from "../../hooks/aiChatHooks";
import { ChatInput } from "./ChatInput";
import { ChatMessage as ChatMessageComponent } from "./ChatMessage";

/** Pairs an assistant message with the chart action it triggered (if any) */
interface MessageEntry {
  message: ChatMessage;
  chartAction?: ChatChartAction;
}

const DRAWER_WIDTH = 380;
// Must be above MUI Dialog (1300) and SpeedDial so the chat is reachable inside the editor
const CHAT_Z_INDEX = 1400;

export function AiChat() {
  const {
    chatOpen,
    openChat,
    closeChat,
    setPendingChartAction,
    currentEditorChartId,
    currentEditorChartName,
    editorEditMode,
    currentPage,
  } = useAiChat();

  const navigate = useNavigate();
  const chatMutation = useAiChatMutation();

  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [entries, setEntries] = useState<MessageEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [entries, chatMutation.isPending]);

  const handleSend = (text: string) => {
    setError(null);

    const userMsg: ChatMessage = { role: "user", content: text };
    const newHistory: ChatMessage[] = [...history, userMsg];

    setHistory(newHistory);
    setEntries((prev) => [...prev, { message: userMsg }]);

    chatMutation.mutate(
      {
        messages: newHistory,
        currentChartId: currentEditorChartId ?? undefined,
        editorEditMode: currentEditorChartId ? editorEditMode : undefined,
        currentPage: currentPage ?? undefined,
      },
      {
        onSuccess: (res) => {
          const assistantMsg: ChatMessage = { role: "assistant", content: res.message };
          setHistory((prev) => [...prev, assistantMsg]);
          setEntries((prev) => [...prev, { message: assistantMsg, chartAction: res.chartAction }]);
          if (res.chartAction) setPendingChartAction(res.chartAction);
        },
        onError: (err) => setError((err as Error).message),
      },
    );
  };

  const handleOpenChart = (action: ChatChartAction) => {
    setPendingChartAction(action);
    navigate("/charts");
  };

  const handleClear = () => {
    setHistory([]);
    setEntries([]);
    setError(null);
  };

  const emptyHint = currentEditorChartId
    ? editorEditMode
      ? "Ask me to modify this chart — add devices, rename it, or describe changes."
      : "Ask me questions about this chart. Switch to Edit Mode to let me make changes."
    : currentPage === "assets"
      ? "Ask me about assets — devices, ports, line types, or what's available."
      : currentPage === "users"
        ? "Ask me about user management or permissions in EasyCharts."
        : "Ask me to list your charts, explain a diagram, or create a new one from scratch.";

  return (
    <>
      {/* FAB — zIndex above fullscreen Dialog (1300) */}
      {!chatOpen && (
        <Fab
          color="secondary"
          onClick={openChat}
          sx={{ position: "fixed", bottom: 96, right: 24, zIndex: CHAT_Z_INDEX }}
          aria-label="Open AI chat"
        >
          <AutoFixHighIcon />
        </Fab>
      )}

      {/* Drawer — temporary (overlay) so it works above the fullscreen chart editor dialog */}
      <Drawer
        anchor="right"
        open={chatOpen}
        onClose={closeChat}
        variant="temporary"
        ModalProps={{ keepMounted: true }}
        sx={{
          zIndex: CHAT_Z_INDEX,
          "& .MuiDrawer-paper": {
            width: DRAWER_WIDTH,
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
          },
        }}
      >
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", px: 2, py: 1.5, borderBottom: 1, borderColor: "divider", gap: 1 }}>
          <AutoFixHighIcon color="secondary" />
          <Typography variant="subtitle1" fontWeight={600} sx={{ flex: 1 }}>
            AI Assistant
          </Typography>
          <Tooltip title="Clear conversation">
            <IconButton size="small" onClick={handleClear} disabled={entries.length === 0}>
              <DeleteSweepIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <IconButton size="small" onClick={closeChat}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Chart context banner — shown when the editor is open */}
        {currentEditorChartId ? (
          <Box sx={{ px: 2, py: 0.75, borderBottom: 1, borderColor: "divider", display: "flex", alignItems: "center", gap: 1 }}>
            <Chip
              size="small"
              icon={editorEditMode ? <EditIcon /> : <VisibilityIcon />}
              label={currentEditorChartName ?? currentEditorChartId.slice(0, 8)}
              color={editorEditMode ? "warning" : "default"}
              variant="outlined"
              sx={{ maxWidth: 200, fontSize: "0.7rem" }}
            />
            <Typography variant="caption" color="text.secondary">
              {editorEditMode ? "Edit mode — AI can modify" : "View mode — AI read-only"}
            </Typography>
          </Box>
        ) : currentPage && (
          <Box sx={{ px: 2, py: 0.75, borderBottom: 1, borderColor: "divider", display: "flex", alignItems: "center", gap: 1 }}>
            <Chip
              size="small"
              label={currentPage === "assets" ? "Assets" : currentPage === "users" ? "Users" : "Charts"}
              color="default"
              variant="outlined"
              sx={{ fontSize: "0.7rem" }}
            />
            <Typography variant="caption" color="text.secondary">
              {currentPage === "assets"
                ? "Focused on assets"
                : currentPage === "users"
                  ? "Focused on user management"
                  : "Focused on charts"}
            </Typography>
          </Box>
        )}

        {/* Message list */}
        <Box sx={{ flex: 1, overflowY: "auto", p: 1.5 }}>
          {entries.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", mt: 4 }}>
              {emptyHint}
            </Typography>
          )}

          {entries.map((entry, i) => (
            <ChatMessageComponent
              key={i}
              message={entry.message}
              chartAction={entry.chartAction}
              onOpenChart={handleOpenChart}
            />
          ))}

          {chatMutation.isPending && (
            <ChatMessageComponent message={{ role: "assistant", content: "Thinking…" }} />
          )}

          {error && (
            <Alert severity="error" sx={{ mt: 1 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <div ref={bottomRef} />
        </Box>

        <ChatInput
          onSend={handleSend}
          loading={chatMutation.isPending}
          disabled={chatMutation.isPending}
        />
      </Drawer>
    </>
  );
}
