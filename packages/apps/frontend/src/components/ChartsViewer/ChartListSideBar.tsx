import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import { IconButton } from '@mui/material';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import type { chartMetadata } from '@easy-charts/easycharts-types';

interface chartsSidebarProps {
  charts: chartMetadata[];
  onSelect: (Chartid: string) => void;
  onEdit: (chartId: string) => void; 
}

export function ChartListSidebar({ charts, onSelect,onEdit }: chartsSidebarProps) {
  return (
    <Box sx={{ width:'100%', flexShrink: 0, borderRight: '1px solid #ddd', height: '100%' }}>
      <List>
        {charts.map((chart) => (
          <ListItem key={chart.id} disablePadding
          secondaryAction={
              <IconButton edge="end" onClick={() => onEdit(chart.id)}>
                <ArrowForwardIosIcon/>
              </IconButton>
            }>
            <ListItemButton
              selected={false}
              onClick={() => onSelect(chart.id)}
            >
              <ListItemText primary={chart.name} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );
}
