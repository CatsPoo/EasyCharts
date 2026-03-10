import type { ChatChartAction, ChatMessage as ChatMessageType } from "@easy-charts/easycharts-types";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import PersonIcon from "@mui/icons-material/Person";
import { Avatar, Box, Button, Paper, Typography } from "@mui/material";

interface ChatMessageProps {
  message: ChatMessageType;
  chartAction?: ChatChartAction;
  onOpenChart?: (action: ChatChartAction) => void;
}

export function ChatMessage({ message, chartAction, onOpenChart }: ChatMessageProps) {
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

      <Box sx={{ maxWidth: "80%", display: "flex", flexDirection: "column", gap: 0.75 }}>
        <Paper
          elevation={0}
          sx={{
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

        {chartAction && onOpenChart && (
          <Button
            size="small"
            variant="outlined"
            startIcon={<OpenInNewIcon />}
            onClick={() => onOpenChart(chartAction)}
            sx={{ alignSelf: "flex-start", textTransform: "none", borderRadius: 2 }}
          >
            Open "{chartAction.chartName}" in editor
          </Button>
        )}
      </Box>
    </Box>
  );
}
