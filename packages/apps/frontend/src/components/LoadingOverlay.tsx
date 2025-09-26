// src/components/LoadingOverlay.tsx
import { Backdrop, CircularProgress, Box, Typography } from "@mui/material";

export function LoadingOverlay({
  open,
  label,
}: { open: boolean; label?: string }) {
  return (
    <Backdrop
      open={open}
      sx={(t) => ({
        zIndex: t.zIndex.modal + 1,     // above AppBar/Dialogs
        bgcolor: "rgba(0,0,0,0.35)",    // transparent dark veil
        color: "#fff",
      })}
    >
      <Box sx={{ display: "grid", gap: 1, placeItems: "center" }}>
        <CircularProgress />
        {label && <Typography variant="body2">{label}</Typography>}
      </Box>
    </Backdrop>
  );
}
