// src/theme/ThemeModeContext.tsx
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";

type Mode = "light" | "dark";

type Ctx = {
  mode: Mode;
  setMode: (m: Mode) => void;
  toggleMode: () => void;
  isDark: boolean;
};

const ThemeModeContext = createContext<Ctx | null>(null);

export function ThemeModeProvider({ children }: { children: React.ReactNode }) {
  // Seed from localStorage (fallback to 'light'). If you’d rather seed from OS once, see comment below.
  const [mode, setModeState] = useState<Mode>(() => {
    const saved = localStorage.getItem("themeMode") as Mode | null;
    return saved === "dark" || saved === "light" ? saved : "light";
    // Optional (one-time OS seed without “system mode”):
    // if (!saved) return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ? "dark" : "light";
  });

  const isDark = mode === "dark";

  // Sync Tailwind’s .dark class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) root.classList.add("dark");
    else root.classList.remove("dark");
  }, [isDark]);

  // Persist explicit choice
  const setMode = useCallback((m: Mode) => {
    setModeState(m);
    localStorage.setItem("themeMode", m);
  }, []);

  // Toggle strictly between light <-> dark
  const toggleMode = useCallback(() => {
    setMode(mode === "dark" ? "light" : "dark");
  }, [mode, setMode]);

  // MUI theme (kept minimal; customize as you like)
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          background: {
            default: isDark ? "#0b1020" : "#ffffff",
            paper: isDark ? "#0f172a" : "#ffffff",
          },
        },
        shape: { borderRadius: 12 },
      }),
    [mode, isDark]
  );

  const value = useMemo<Ctx>(() => ({ mode, setMode, toggleMode, isDark }), [mode, setMode, toggleMode, isDark]);

  return (
    <ThemeModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
}

export function useThemeMode() {
  const ctx = useContext(ThemeModeContext);
  if (!ctx) throw new Error("useThemeMode must be used within ThemeModeProvider");
  return ctx;
}
