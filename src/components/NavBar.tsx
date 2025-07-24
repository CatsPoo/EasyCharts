import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';

interface NavBarProps {
  value: number;
  onChange: (newValue: number) => void;
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
      </Tabs>
    </AppBar>
  );
}
