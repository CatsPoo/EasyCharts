import SendIcon from "@mui/icons-material/Send";
import { Box, CircularProgress, IconButton, TextField } from "@mui/material";
import { type KeyboardEvent, useState } from "react";

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  loading?: boolean;
}

export function ChatInput({ onSend, disabled, loading }: ChatInputProps) {
  const [value, setValue] = useState("");

  const handleSend = () => {
    const text = value.trim();
    if (!text) return;
    onSend(text);
    setValue("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Box sx={{ display: "flex", gap: 1, alignItems: "flex-end", p: 1.5, borderTop: 1, borderColor: "divider" }}>
      <TextField
        fullWidth
        multiline
        maxRows={4}
        size="small"
        placeholder="Ask about charts, create a new one…"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled || loading}
        sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3 } }}
      />
      <IconButton
        color="primary"
        onClick={handleSend}
        disabled={!value.trim() || disabled || loading}
        sx={{ mb: 0.25 }}
      >
        {loading ? <CircularProgress size={20} /> : <SendIcon />}
      </IconButton>
    </Box>
  );
}
