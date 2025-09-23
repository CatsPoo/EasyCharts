// src/pages/LoginPage.tsx
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../auth/useAuth";
import {
  AppBar,
  Toolbar,
  Typography,
  Paper,
  Box,
  TextField,
  Button,
  Alert,
  Divider,
} from "@mui/material";
import { ThemeToggleButton } from "../components/ThemeToggleButton";
import { NavBar } from "../components/NavBar";

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || "/";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(username.trim(), password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError("Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh", width: "100vw" }}>
      {/* Top bar — mirrors ChartsPage style */}
      <NavBar children={undefined}/>

      {/* Full-width canvas; center the card perfectly */}
      <Box
        sx={{
          flex: 1,
          width: "100%",
          minHeight: "calc(100vh - 64px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: { xs: 2, md: 4 }, // breathing room on small screens
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          style={{ width: "100%" }}
        >
          {/* Wide but tasteful: uses almost the full screen width, remains centered */}
          <Paper
            elevation={3}
            sx={{
              mx: "auto",
              p: { xs: 3, md: 4 },
              width: "min(900px, 92vw)", // fills the screen wide while staying elegant
              borderRadius: 3,
              border: (t) =>
                `1px solid ${t.palette.mode === "dark" ? t.palette.divider : "#e2e8f0"}`, // slate-200ish
              bgcolor: (t) => t.palette.background.paper,
              textAlign: "center", // center all inner components (titles, messages)
            }}
            className="border-slate-200 dark:border-slate-700"
          >
            <Typography variant="h5" gutterBottom>
              Sign in
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Access your charts and assets.
            </Typography>

            <Divider sx={{ mb: 2 }} />

            {error && (
              <Alert severity="error" sx={{ mb: 2, textAlign: "left" }}>
                {error}
              </Alert>
            )}

            <Box
              component="form"
              onSubmit={onSubmit}
              sx={{
                display: "grid",
                gap: 2,
                // keep inputs nicely centered with a readable max width while still using the full page width
                maxWidth: "720px",
                mx: "auto",
              }}
            >
              <TextField
                label="Username"
                fullWidth
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
              />
              <TextField
                label="Password"
                fullWidth
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              {/* Accent matches your editor toggle background (#7676c4) */}
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={submitting}
                sx={{ mt: 1, bgcolor: "#7676c4", ":hover": { bgcolor: "#6b6bb8" } }}
              >
                {submitting ? "Signing in…" : "Sign in"}
              </Button>
            </Box>
          </Paper>
        </motion.div>
      </Box>
    </Box>
  );
};

export default LoginPage;
