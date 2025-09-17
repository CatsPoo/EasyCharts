import type { ChartCreate } from "@easy-charts/easycharts-types";
import AddIcon from "@mui/icons-material/Add";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import { Fab, IconButton, LinearProgress, Tooltip } from "@mui/material";
import Box from "@mui/material/Box";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import { useCallback, useState } from "react";
import {
  useChartsMetadataQuery,
  useCreateChartMutation,
  useDeleteChartMutation,
} from "../../hooks/chartsHooks";
import { CreateChartDialog } from "../CreateChartDialog";
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import { ConfirmDialog } from "../DeleteAlertDialog";

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
    data: chartsMeatadata,
    isLoading: isChartsMetadataLoading,
    error: chartMetadataLoading,
  } = useChartsMetadataQuery();

  const createMutation = useCreateChartMutation();
  const deletemut = useDeleteChartMutation();

  const [openCreate, setOpenCreate] = useState(false);
  const [openDeleteDialog,setOpenDeleteDialog] = useState(false)
  const [pandingChartToDelete,setPandingChartToDelete] = useState<string>('')
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

  const onDelete = useCallback((chartId:string)=>{
    setOpenDeleteDialog(true)
    setPandingChartToDelete(chartId)
  },[])

  const onDeleteDialogClose = useCallback(()=>{
    setPandingChartToDelete('')
    setOpenDeleteDialog(false)
  },[])

  const onDeleteDialogConfirm = useCallback(()=>{
    try {
      deletemut.mutateAsync({id:pandingChartToDelete})
      setPandingChartToDelete('')
      onSelect('')
      setOpenDeleteDialog(false)
    }catch(e){
      console.log(e)
    }
    
  },[deletemut, onSelect, pandingChartToDelete])
  
  return (isChartsMetadataLoading)? <LinearProgress /> :(
    <Box
      sx={(t) => ({
        width: "100%",
        flexShrink: 0,
        height: "100%",
        borderRight: 1,
        borderColor: t.palette.mode === "dark" ? "divider" : "primary.200",
        bgcolor:
          t.palette.mode === "dark" ? "background.paper" : "primary.light",
        color: "text.primary",
        transition: "background-color 200ms, border-color 200ms",
      })}
    >
      {isMyCharts && (
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
          {/*when user system with permition will be build, move this dialog to privilaged component area */}
          <ConfirmDialog
          onCancel={onDeleteDialogClose}
          onConfirm={onDeleteDialogConfirm}
          open={openDeleteDialog}
          confirmText="Delete"
          confirmColor="error"
          description="Are you shure you want to permenently delete chart"
          cancelText="Cancel"/>
        
        </>
      )}
      <List>
        {(chartsMeatadata ?? []).map((chart) => (
          <ListItem
            key={chart.id}
            disablePadding
            secondaryAction={
              <div>
                {/*when user system with permition will be build, move this dialog to privilaged component area */}
                <IconButton edge="end" onClick={() => onDelete(chart.id)}>
                  <DeleteForeverIcon/>
                </IconButton>
                <IconButton edge="end" onClick={() => onEdit(chart.id)}>
                  <ArrowForwardIosIcon />
                </IconButton>
              </div>
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
