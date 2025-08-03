import { Device } from "@easy-charts/easycharts-types";
import { Box, Typography } from "@mui/material";

export function DeviceAssetsListItem(device:Device){
    return (
    <Box
      sx={{
        width: '100%',
        p: 1,
        bgcolor: 'inherit',
        borderRadius: 1,
        '&:hover': { bgcolor: 'action.hover' },
      }}
    >
      <Typography variant="subtitle1">{device.name}</Typography>

      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 1,
          mt: 0.5,
        }}
      >
        <Typography variant="body2">Type: {device.type}</Typography>

        {device.model && (
          <Typography variant="body2">Model: {device.model}</Typography>
        )}

        {device.vendor && (
          <Typography variant="body2">Vendor: {device.vendor}</Typography>
        )}

        {device.ipAddress && (
          <Typography variant="body2">IP: {device.ipAddress}</Typography>
        )}

      </Box>
    </Box>
    )
    
}