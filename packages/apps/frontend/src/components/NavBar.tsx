import AppBar from '@mui/material/AppBar';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import type { Dispatch, SetStateAction } from 'react';
import { Toolbar } from '@mui/material';
import {ThemeToggleButton} from './ThemeToggleButton'

interface NavBarProps {
  value: number;
  onChange: Dispatch<SetStateAction<number>>;
}

export function NavBar({ value, onChange }: NavBarProps) {
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
        <div className="flex-1">
          <Tabs
            value={value}
            onChange={(_, v) => onChange(v)}
            textColor="inherit"
            indicatorColor="secondary"
          >
            <Tab label="My Charts" />
            <Tab label="Shared Charts" />
            <Tab label="Assets" />
          </Tabs>
        </div>
        <ThemeToggleButton />
      </Toolbar>
    </AppBar>
  );
}
