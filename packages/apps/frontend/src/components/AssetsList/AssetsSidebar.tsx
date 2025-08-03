import { Box, List, ListItem, ListItemButton, ListItemText } from "@mui/material";

interface assetsSidebarProps {
  assets : string[]
  selectedAsset : string
  onSelect: (asset: string) => void;
}

export function AssetSidebar({ assets,selectedAsset, onSelect}: assetsSidebarProps) {
  return (
    <Box sx={{ width:250, flexShrink: 0, borderRight: '1px solid #ddd', height: '100%' }}>
      <List>
        {assets.map((asset) => (
          <ListItem disablePadding>
            <ListItemButton
              selected={(asset === selectedAsset)}
              onClick={() => onSelect(asset)}
            >
              <ListItemText primary={asset} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );
}
