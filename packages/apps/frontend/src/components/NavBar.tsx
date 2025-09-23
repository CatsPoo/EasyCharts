import { Box, Button, Toolbar, Typography } from "@mui/material";
import AppBar from "@mui/material/AppBar";
import { useAuth } from "../auth/useAuth";
import { ThemeToggleButton } from "./ThemeToggleButton";

type NavBarProps = {
  children?: React.ReactNode;
};

export function NavBar({ children }: NavBarProps) {
  const { user, logout } = useAuth();

  return (
    <AppBar
      position="static"
      sx={(t) => ({
        bgcolor:
          t.palette.mode === "dark"
            ? t.palette.background.paper
            : t.palette.primary.main,
        color:
          t.palette.mode === "dark"
            ? t.palette.text.primary
            : t.palette.primary.contrastText,
        transition: "background-color 200ms, color 200ms",
      })}
    >
      <Toolbar
        sx={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 1,
          minHeight: 64,
        }}
      >
        {/* Leftmost: brand */}
        <Typography
          variant="h6"
          sx={{ mr: 2, whiteSpace: "nowrap", lineHeight: 1 }}
        >
          EasyCharts
        </Typography>

        {/* Children live right after the brand */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            minWidth: 0, // allow shrinking if space is tight
          }}
        >
          {children}
        </Box>

        {/* Spacer pushes the next items to the far right */}
        <Box sx={{ flexGrow: 1 }} />

        {/* Logout/user box sits to the LEFT of the theme toggle */}
        {user && (
          <Box
            sx={(t) => ({
              display: "flex",
              alignItems: "center",
              gap: 1,
              bgcolor: t.palette.background.paper,
              color: t.palette.text.primary,
              borderRadius: 2,
              px: 1.5,
              py: 0.5,
              boxShadow: 2,
              mr: 1,
            })}
          >
            <span style={{ opacity: 0.85, fontSize: 12 }}>
              {user?.username ?? user?.id ?? "User"}
            </span>
            <Button
              size="small"
              variant="outlined"
              color="inherit"
              onClick={logout}
              sx={{ borderColor: "divider" }}
            >
              Logout
            </Button>
          </Box>
        )}

        {/* Rightmost: theme toggle */}
        <ThemeToggleButton />
      </Toolbar>
    </AppBar>
  );
}
