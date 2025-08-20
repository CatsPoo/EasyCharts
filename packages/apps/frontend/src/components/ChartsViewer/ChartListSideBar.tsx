import type { ChartCreate } from "@easy-charts/easycharts-types";
import AddIcon from "@mui/icons-material/Add";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import { Fab, IconButton, Tooltip } from "@mui/material";
import Box from "@mui/material/Box";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import { useState } from "react";
import {
  useChartsMetadataQuery,
  useCreateChartMutation,
} from "../../hooks/chartsHooks";
import { CreateChartDialog } from "../CreateChartDialog";

interface chartsSidebarProps {
  onSelect: (Chartid: string) => void;
  onEdit: (chartId: string) => void;
  isMyCharts: boolean;
}

export function ChartListSidebar({
  onSelect,
  onEdit,
  isMyCharts,
}: chartsSidebarProps) {
  const {
    data: chartsMetadataList,
    isLoading,
    error: createChartError,
  } = useChartsMetadataQuery();
  const createMutation = useCreateChartMutation();

  const [openCreate, setOpenCreate] = useState(false);

  const handleCreateChartDialogOpen = () => setOpenCreate(true);
  const handleCreateChartDialogClose = () => setOpenCreate(false);

  const handleCreate = async (payload: ChartCreate) => {
    try {
      await createMutation.mutateAsync(payload);
      handleCreateChartDialogClose();
    } catch (e) {
      // Optionally show a toast/snackbar
      console.error(e);
    }
  };

  return (
    <Box
      sx={{
        width: "100%",
        flexShrink: 0,
        borderRight: "1px solid #ddd",
        height: "100%",
      }}
    >
      (isMyCharts && (
      <>
        <Tooltip title="Add chart">
          <Fab
            color="primary"
            onClick={handleCreateChartDialogOpen}
            sx={{ position: "fixed", right: 24, bottom: 24, zIndex: 1300 }}
            aria-label="add chart"
          >
            <AddIcon />
          </Fab>
        </Tooltip>

        <CreateChartDialog
          open={openCreate}
          onClose={handleCreateChartDialogClose}
          onSubmit={handleCreate}
          submitting={createMutation.isPending}
        />
      </>
      ))
      <List>
        {(chartsMetadataList ?? []).map((chart) => (
          <ListItem
            key={chart.id}
            disablePadding
            secondaryAction={
              <IconButton edge="end" onClick={() => onEdit(chart.id)}>
                <ArrowForwardIosIcon />
              </IconButton>
            }
          >
            <ListItemButton selected={false} onClick={() => onSelect(chart.id)}>
              <ListItemText primary={chart.name} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );
}
