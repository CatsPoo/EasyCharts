import { Box, Button, Toolbar } from '@mui/material';
import AppBar from '@mui/material/AppBar';
import { useAuth } from '../auth/useAuth';
import { ThemeToggleButton } from './ThemeToggleButton';


export function NavBar({children}) {
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
      <Toolbar className="w-full flex items-center">
        {children}
        {(user)&& <Box
          sx={{
            position: "fixed",
            top: 8,
            right: 12,
            zIndex: 1000,
            display: "flex",
            gap: 1,
            alignItems: "center",
            bgcolor: "background.paper",
            borderRadius: 2,
            px: 1.5,
            py: 0.5,
            boxShadow: 2,
          }}
        >
          <span style={{ opacity: 0.8, fontSize: 12 }}>
            {user?.username ?? user?.id ?? "User"}
          </span>
          <Button size="small" variant="outlined" onClick={logout}>
            Logout
          </Button>
        </Box>}
        <ThemeToggleButton />
      </Toolbar>
    </AppBar>
  );
}
