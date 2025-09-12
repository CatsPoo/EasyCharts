import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import { IconButton, Tooltip } from "@mui/material";
import { useThemeMode } from "../contexts/ThemeModeContext";

export function ThemeToggleButton() {
  const { isDark, toggleMode } = useThemeMode();
  return (
    <Tooltip title={isDark ? "Switch to light" : "Switch to dark"}>
      <IconButton color="inherit" onClick={toggleMode} aria-label="toggle theme">
        {isDark ?  <DarkModeIcon/> : <LightModeIcon />}
      </IconButton>
    </Tooltip>
  );
}
