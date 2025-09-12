// useColorScheme.ts
import { useEffect, useMemo } from "react";
import useMediaQuery from "@mui/material/useMediaQuery";
import { createTheme, type Theme } from "@mui/material/styles";

export function useColorScheme(): { isDark: boolean; theme: Theme } {
  const isDark = useMediaQuery("(prefers-color-scheme: dark)", { noSsr: true });

  // Tailwind (class strategy)
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) root.classList.add("dark");
    else root.classList.remove("dark");
  }, [isDark]);

  // MUI theme
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: isDark ? "dark" : "light",
          background: { default: isDark ? "#0b1020" : "#ffffff", paper: isDark ? "#0f172a" : "#ffffff" },
        },
        shape: { borderRadius: 12 },
      }),
    [isDark]
  );

  return { isDark, theme };
}
