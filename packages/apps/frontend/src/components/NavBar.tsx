import { Box, Button, Toolbar, Typography } from "@mui/material";
import AppBar from "@mui/material/AppBar";
import { useAuth } from "../auth/useAuth";
import { ThemeToggleButton } from "./ThemeToggleButton";
import { RequirePermissions } from "../auth/RequirePermissions";
import { Permission } from "@easy-charts/easycharts-types";
import { useNavigate } from "react-router-dom";
import type { ReactNode } from "react";

type NavBarProps = {
  children?: ReactNode;
};

export function NavBar({ children }: NavBarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={(t) => ({
        bgcolor: t.palette.mode === "dark"
          ? t.palette.background.paper
          : t.palette.primary.main,
        color: "#ffffff",
        boxShadow: t.palette.mode === "dark"
          ? "none"
          : "0 2px 8px rgba(99,102,241,0.3)",
        transition: "background-color 200ms",
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
          sx={{
            mr: 2,
            whiteSpace: "nowrap",
            lineHeight: 1,
            fontWeight: 700,
            color: "inherit",
          }}
        >
          EasyCharts
        </Typography>

        {/* Children live right after the brand */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            minWidth: 0,
          }}
        >
          {children}
        </Box>

        {/* Spacer pushes the next items to the far right */}
        <Box sx={{ flexGrow: 1 }} />
        <RequirePermissions required={[Permission.USER_MANAGE]}>
          <Button color="inherit" onClick={() => navigate("/users")}>
            Manage Users
          </Button>
        </RequirePermissions>
        {/* Logout/user box sits to the LEFT of the theme toggle */}
        {user && (
          <Box
            sx={(t) => ({
              display: "flex",
              alignItems: "center",
              gap: 1,
              bgcolor: "rgba(255,255,255,0.15)",
              color: "#ffffff",
              border: "1px solid rgba(255,255,255,0.25)",
              borderRadius: 2,
              px: 1.5,
              py: 0.5,
              mr: 1,
              ...(t.palette.mode === "dark" && {
                bgcolor: t.palette.background.default,
                color: t.palette.text.primary,
                border: `1px solid ${t.palette.divider}`,
              }),
            })}
          >
            <span style={{ opacity: 0.9, fontSize: 12 }}>
              {user?.username ?? user?.id ?? "User"}
            </span>
            <Button
              size="small"
              variant="outlined"
              color="inherit"
              onClick={logout}
              sx={(t) => ({
                borderColor: t.palette.mode === "dark"
                  ? t.palette.divider
                  : "rgba(255,255,255,0.4)",
                "&:hover": {
                  borderColor: t.palette.mode === "dark"
                    ? t.palette.divider
                    : "rgba(255,255,255,0.7)",
                  bgcolor: "rgba(255,255,255,0.1)",
                },
              })}
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
