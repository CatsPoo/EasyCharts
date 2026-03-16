import type { ChatMessage as ChatMessageType } from "@easy-charts/easycharts-types";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import PersonIcon from "@mui/icons-material/Person";
import { Avatar, Box, Paper, Typography } from "@mui/material";

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <Box
      sx={{
        display: "flex",
        gap: 1,
        flexDirection: isUser ? "row-reverse" : "row",
        alignItems: "flex-start",
        mb: 1.5,
      }}
    >
      <Avatar
        sx={{
          width: 28,
          height: 28,
          bgcolor: isUser ? "primary.main" : "secondary.main",
          flexShrink: 0,
          mt: 0.25,
        }}
      >
        {isUser ? <PersonIcon sx={{ fontSize: 16 }} /> : <AutoFixHighIcon sx={{ fontSize: 16 }} />}
      </Avatar>

      <Paper
        elevation={0}
        sx={{
          maxWidth: "80%",
          px: 1.5,
          py: 1,
          bgcolor: isUser ? "primary.main" : "action.hover",
          color: isUser ? "primary.contrastText" : "text.primary",
          borderRadius: isUser ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
        }}
      >
        <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
          {message.content}
        </Typography>
      </Paper>
    </Box>
  );
}
