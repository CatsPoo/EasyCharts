import AppBar from '@mui/material/AppBar';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import type { Dispatch, SetStateAction } from 'react';

interface NavBarProps {
  value: Number;
  onChange: Dispatch<SetStateAction<number>>;
}

export function NavBar({ value, onChange }: NavBarProps) {
  return (
    <AppBar position="static">
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
    </AppBar>
  );
}
