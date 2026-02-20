import { Permission, type ChartMetadata } from "@easy-charts/easycharts-types";
import AddIcon from "@mui/icons-material/Add";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import DriveFileMoveIcon from "@mui/icons-material/DriveFileMove";
import FolderIcon from "@mui/icons-material/Folder";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import InboxIcon from "@mui/icons-material/Inbox";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Fab,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Tooltip,
  Typography,
} from "@mui/material";
import Box from "@mui/material/Box";
import { useCallback, useState } from "react";
import { RequirePermissions } from "../../auth/RequirePermissions";
import type { ChartCreate } from "@easy-charts/easycharts-types";
import {
  useCreateChartMutation,
  useDeleteChartMutation,
} from "../../hooks/chartsHooks";
import {
  useAddChartToDirectoryMutation,
  useCreateDirectoryMutation,
  useDeleteDirectoryMutation,
  useDirectoryChartsMetadataQuery,
  useRemoveChartFromDirectoryMutation,
  useRootDirectoriesQuery,
  useUnassignedChartsQuery,
} from "../../hooks/chartsDirectoriesHooks";
import { ConfirmDialog } from "../DeleteAlertDialog";
import { CreateChartDialog } from "../CreateChartDialog";

interface DirectoryBrowserSidebarProps {
  onSelect: (chartId: string) => void;
  onEdit: (chartId: string) => void;
}

type View = "directories" | "directory-charts" | "unassigned";

export function DirectoryBrowserSidebar({ onSelect, onEdit }: DirectoryBrowserSidebarProps) {
  const [view, setView] = useState<View>("directories");
  const [selectedDirId, setSelectedDirId] = useState<string | null>(null);
  const [selectedDirName, setSelectedDirName] = useState<string>("");

  // Delete chart state
  const [deleteChartDialogOpen, setDeleteChartDialogOpen] = useState(false);
  const [pendingChartToDelete, setPendingChartToDelete] = useState("");

  // Delete directory state
  const [deleteDirDialogOpen, setDeleteDirDialogOpen] = useState(false);
  const [pendingDirToDelete, setPendingDirToDelete] = useState("");

  // Create chart dialog
  const [createChartOpen, setCreateChartOpen] = useState(false);

  // Create directory state
  const [createDirOpen, setCreateDirOpen] = useState(false);
  const [newDirName, setNewDirName] = useState("");

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{ mouseX: number; mouseY: number; chartId: string } | null>(null);

  // Move chart dialog state
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [pendingChartToMove, setPendingChartToMove] = useState("");

  const { data: directories, isLoading: dirsLoading } = useRootDirectoriesQuery();
  const { data: dirCharts, isLoading: dirChartsLoading } = useDirectoryChartsMetadataQuery(
    view === "directory-charts" ? selectedDirId : null,
  );
  const { data: unassignedCharts, isLoading: unassignedLoading } = useUnassignedChartsQuery();

  const createChartMutation = useCreateChartMutation();
  const deleteChartMutation = useDeleteChartMutation();
  const addChartToDirectoryMutation = useAddChartToDirectoryMutation();
  const removeChartFromDirectoryMutation = useRemoveChartFromDirectoryMutation();
  const createDirMutation = useCreateDirectoryMutation();
  const deleteDirMutation = useDeleteDirectoryMutation();

  const handleOpenDirectory = useCallback((id: string, name: string) => {
    setSelectedDirId(id);
    setSelectedDirName(name);
    setView("directory-charts");
    onSelect(""); // deselect chart
  }, [onSelect]);

  const handleOpenUnassigned = useCallback(() => {
    setSelectedDirId(null);
    setSelectedDirName("");
    setView("unassigned");
    onSelect("");
  }, [onSelect]);

  const handleBack = useCallback(() => {
    setView("directories");
    setSelectedDirId(null);
    onSelect("");
  }, [onSelect]);

  const handleCreateChart = useCallback(async (dto: ChartCreate) => {
    const newChart = await createChartMutation.mutateAsync(dto);
    if (selectedDirId) {
      await addChartToDirectoryMutation.mutateAsync({ directoryId: selectedDirId, chartId: newChart.id });
    }
    setCreateChartOpen(false);
  }, [createChartMutation, addChartToDirectoryMutation, selectedDirId]);

  const handleCreateDirectory = useCallback(async () => {
    if (!newDirName.trim()) return;
    await createDirMutation.mutateAsync({ name: newDirName.trim(), parentId: null });
    setNewDirName("");
    setCreateDirOpen(false);
  }, [createDirMutation, newDirName]);

  const handleDeleteChart = useCallback((chartId: string) => {
    setPendingChartToDelete(chartId);
    setDeleteChartDialogOpen(true);
  }, []);

  const handleConfirmDeleteChart = useCallback(() => {
    deleteChartMutation.mutateAsync({ id: pendingChartToDelete });
    setPendingChartToDelete("");
    onSelect("");
    setDeleteChartDialogOpen(false);
  }, [deleteChartMutation, onSelect, pendingChartToDelete]);

  const handleDeleteDir = useCallback((dirId: string) => {
    setPendingDirToDelete(dirId);
    setDeleteDirDialogOpen(true);
  }, []);

  const handleConfirmDeleteDir = useCallback(() => {
    deleteDirMutation.mutateAsync(pendingDirToDelete);
    setPendingDirToDelete("");
    setDeleteDirDialogOpen(false);
  }, [deleteDirMutation, pendingDirToDelete]);

  const handleChartContextMenu = useCallback((e: React.MouseEvent, chartId: string) => {
    e.preventDefault();
    setContextMenu({ mouseX: e.clientX, mouseY: e.clientY, chartId });
  }, []);

  const handleContextMenuClose = useCallback(() => setContextMenu(null), []);

  const handleContextMenuDelete = useCallback(() => {
    if (!contextMenu) return;
    handleDeleteChart(contextMenu.chartId);
    setContextMenu(null);
  }, [contextMenu, handleDeleteChart]);

  const handleContextMenuEdit = useCallback(() => {
    if (!contextMenu) return;
    onEdit(contextMenu.chartId);
    setContextMenu(null);
  }, [contextMenu, onEdit]);

  const handleContextMenuMove = useCallback(() => {
    if (!contextMenu) return;
    setPendingChartToMove(contextMenu.chartId);
    setMoveDialogOpen(true);
    setContextMenu(null);
  }, [contextMenu]);

  const handleMoveToDirectory = useCallback(async (targetDirId: string) => {
    if (selectedDirId) {
      await removeChartFromDirectoryMutation.mutateAsync({ directoryId: selectedDirId, chartId: pendingChartToMove });
    }
    await addChartToDirectoryMutation.mutateAsync({ directoryId: targetDirId, chartId: pendingChartToMove });
    setPendingChartToMove("");
    setMoveDialogOpen(false);
  }, [selectedDirId, pendingChartToMove, removeChartFromDirectoryMutation, addChartToDirectoryMutation]);

  const handleMakeUnassigned = useCallback(async () => {
    if (!selectedDirId) return;
    await removeChartFromDirectoryMutation.mutateAsync({ directoryId: selectedDirId, chartId: pendingChartToMove });
    setPendingChartToMove("");
    setMoveDialogOpen(false);
  }, [selectedDirId, pendingChartToMove, removeChartFromDirectoryMutation]);

  const isLoading = dirsLoading || (view === "directory-charts" && dirChartsLoading) || (view === "unassigned" && unassignedLoading);

  const sidebarSx = (t: any) => ({
    width: "100%",
    flexShrink: 0,
    height: "100%",
    borderRight: 1,
    borderColor: t.palette.mode === "dark" ? "divider" : "primary.200",
    bgcolor: t.palette.mode === "dark" ? "background.paper" : "primary.light",
    color: "text.primary",
    display: "flex",
    flexDirection: "column",
    transition: "background-color 200ms, border-color 200ms",
    overflow: "hidden",
  });

  const chartsToShow: ChartMetadata[] =
    view === "directory-charts" ? (dirCharts ?? []) :
    view === "unassigned" ? (unassignedCharts ?? []) :
    [];

  if (isLoading) return <LinearProgress />;

  // ─── Directory list view ────────────────────────────────────────────────────
  if (view === "directories") {
    return (
      <Box sx={sidebarSx}>
        <Box sx={{ px: 1.5, pt: 1.5, pb: 0.5 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={600} letterSpacing={1}>
            DIRECTORIES
          </Typography>
        </Box>

        <List dense sx={{ flex: 1, overflowY: "auto" }}>
          {/* Unassigned charts option */}
          <ListItem disablePadding>
            <ListItemButton onClick={handleOpenUnassigned}>
              <ListItemIcon sx={{ minWidth: 32 }}>
                <InboxIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Unassigned Charts" primaryTypographyProps={{ fontSize: 13 }} />
            </ListItemButton>
          </ListItem>

          {(directories ?? []).map((dir) => (
            <ListItem
              key={dir.id}
              disablePadding
              secondaryAction={
                <RequirePermissions required={[Permission.CHART_DELETE]}>
                  <IconButton edge="end" size="small" onClick={() => handleDeleteDir(dir.id)}>
                    <DeleteForeverIcon fontSize="small" />
                  </IconButton>
                </RequirePermissions>
              }
            >
              <ListItemButton onClick={() => handleOpenDirectory(dir.id, dir.name)}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <FolderIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={dir.name} primaryTypographyProps={{ fontSize: 13 }} />
              </ListItemButton>
            </ListItem>
          ))}

          {(directories ?? []).length === 0 && (
            <ListItem>
              <ListItemText
                secondary="No directories yet"
                secondaryTypographyProps={{ fontSize: 12, textAlign: "center" }}
              />
            </ListItem>
          )}
        </List>

        {/* FAB speed dial for creating directory or unassigned chart */}
        <RequirePermissions required={[Permission.CHART_CREATE]}>
          <SpeedDial
            ariaLabel="Create"
            icon={<SpeedDialIcon />}
            sx={{ position: "fixed", right: 16, bottom: 16, zIndex: 1300 }}
            FabProps={{ size: "small", color: "primary" }}
          >
            <SpeedDialAction
              icon={<FolderIcon fontSize="small" />}
              tooltipTitle="New directory"
              tooltipOpen
              onClick={() => setCreateDirOpen(true)}
            />
            <SpeedDialAction
              icon={<AddIcon fontSize="small" />}
              tooltipTitle="New unassigned chart"
              tooltipOpen
              onClick={() => setCreateChartOpen(true)}
            />
          </SpeedDial>
          <CreateChartDialog
            open={createChartOpen}
            onClose={() => setCreateChartOpen(false)}
            onSubmit={handleCreateChart}
            submitting={createChartMutation.isPending}
          />
        </RequirePermissions>

        {/* Create directory inline dialog (simple prompt) */}
        {createDirOpen && (
          <Box
            sx={{
              position: "fixed",
              bottom: 80,
              right: 16,
              bgcolor: "background.paper",
              boxShadow: 3,
              borderRadius: 2,
              p: 2,
              zIndex: 1400,
              display: "flex",
              gap: 1,
              alignItems: "center",
            }}
          >
            <input
              autoFocus
              placeholder="Directory name"
              value={newDirName}
              onChange={(e) => setNewDirName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateDirectory();
                if (e.key === "Escape") setCreateDirOpen(false);
              }}
              style={{
                border: "1px solid #ccc",
                borderRadius: 4,
                padding: "4px 8px",
                fontSize: 13,
                outline: "none",
              }}
            />
            <button onClick={handleCreateDirectory} style={{ cursor: "pointer" }}>Add</button>
            <button onClick={() => setCreateDirOpen(false)} style={{ cursor: "pointer" }}>✕</button>
          </Box>
        )}

        <ConfirmDialog
          open={deleteDirDialogOpen}
          onCancel={() => { setDeleteDirDialogOpen(false); setPendingDirToDelete(""); }}
          onConfirm={handleConfirmDeleteDir}
          confirmText="Delete"
          confirmColor="error"
          description="Permanently delete this directory? Charts inside will not be deleted."
          cancelText="Cancel"
        />
      </Box>
    );
  }

  // ─── Charts list view (directory or unassigned) ──────────────────────────────
  return (
    <Box sx={sidebarSx}>
      {/* Header with back button */}
      <Box sx={{ display: "flex", alignItems: "center", px: 1, pt: 0.5 }}>
        <IconButton size="small" onClick={handleBack}>
          <ArrowBackIosIcon fontSize="small" />
        </IconButton>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, overflow: "hidden" }}>
          {view === "directory-charts"
            ? <FolderOpenIcon fontSize="small" color="primary" />
            : <InboxIcon fontSize="small" color="action" />
          }
          <Typography variant="caption" fontWeight={600} noWrap>
            {view === "directory-charts" ? selectedDirName : "Unassigned Charts"}
          </Typography>
        </Box>
      </Box>

      <List dense sx={{ flex: 1, overflowY: "auto" }}>
        {chartsToShow.map((chart) => (
          <ListItem
            key={chart.id}
            disablePadding
            onContextMenu={(e) => handleChartContextMenu(e, chart.id)}
            secondaryAction={
              <Box>
                <RequirePermissions required={[Permission.CHART_DELETE]}>
                  <IconButton edge="end" size="small" onClick={() => handleDeleteChart(chart.id)}>
                    <DeleteForeverIcon fontSize="small" />
                  </IconButton>
                </RequirePermissions>
                <IconButton edge="end" size="small" onClick={() => onEdit(chart.id)}>
                  <ArrowForwardIosIcon fontSize="small" />
                </IconButton>
              </Box>
            }
          >
            <ListItemButton onClick={() => onSelect(chart.id)}>
              <ListItemText primary={chart.name} primaryTypographyProps={{ fontSize: 13 }} />
            </ListItemButton>
          </ListItem>
        ))}

        {chartsToShow.length === 0 && (
          <ListItem>
            <ListItemText
              secondary="No charts here"
              secondaryTypographyProps={{ fontSize: 12, textAlign: "center" }}
            />
          </ListItem>
        )}
      </List>

      {/* FAB for creating a chart (only in directory view) */}
      {view === "directory-charts" && (
        <RequirePermissions required={[Permission.CHART_CREATE]}>
          <Tooltip title="Add chart">
            <Fab
              color="primary"
              size="small"
              onClick={() => setCreateChartOpen(true)}
              sx={{ position: "fixed", right: 24, bottom: 24, zIndex: 1300 }}
            >
              <AddIcon />
            </Fab>
          </Tooltip>
          <CreateChartDialog
            open={createChartOpen}
            onClose={() => setCreateChartOpen(false)}
            onSubmit={handleCreateChart}
            submitting={createChartMutation.isPending}
          />
        </RequirePermissions>
      )}

      <ConfirmDialog
        open={deleteChartDialogOpen}
        onCancel={() => { setDeleteChartDialogOpen(false); setPendingChartToDelete(""); }}
        onConfirm={handleConfirmDeleteChart}
        confirmText="Delete"
        confirmColor="error"
        description="Permanently delete this chart?"
        cancelText="Cancel"
      />

      {/* Right-click context menu */}
      <Menu
        open={contextMenu !== null}
        onClose={handleContextMenuClose}
        anchorReference="anchorPosition"
        anchorPosition={contextMenu ? { top: contextMenu.mouseY, left: contextMenu.mouseX } : undefined}
      >
        <MenuItem onClick={handleContextMenuEdit}>
          <ListItemIcon><ArrowForwardIosIcon fontSize="small" /></ListItemIcon>
          Edit chart
        </MenuItem>
        <MenuItem onClick={handleContextMenuMove}>
          <ListItemIcon><DriveFileMoveIcon fontSize="small" /></ListItemIcon>
          Move to directory
        </MenuItem>
        <Divider />
        <RequirePermissions required={[Permission.CHART_DELETE]}>
          <MenuItem onClick={handleContextMenuDelete} sx={{ color: "error.main" }}>
            <ListItemIcon><DeleteForeverIcon fontSize="small" color="error" /></ListItemIcon>
            Delete chart
          </MenuItem>
        </RequirePermissions>
      </Menu>

      {/* Move to directory dialog */}
      <Dialog open={moveDialogOpen} onClose={() => setMoveDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Move chart to directory</DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          <List dense>
            {selectedDirId && (
              <>
                <ListItem disablePadding>
                  <ListItemButton
                    onClick={handleMakeUnassigned}
                    disabled={removeChartFromDirectoryMutation.isPending}
                  >
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <InboxIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Unassigned (no directory)" primaryTypographyProps={{ fontStyle: "italic" }} />
                  </ListItemButton>
                </ListItem>
                <Divider />
              </>
            )}
            {(directories ?? []).map((dir) => (
              <ListItem key={dir.id} disablePadding>
                <ListItemButton
                  onClick={() => handleMoveToDirectory(dir.id)}
                  disabled={removeChartFromDirectoryMutation.isPending || addChartToDirectoryMutation.isPending}
                >
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <FolderIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary={dir.name} />
                </ListItemButton>
              </ListItem>
            ))}
            {(directories ?? []).length === 0 && (
              <ListItem>
                <ListItemText secondary="No directories available" secondaryTypographyProps={{ textAlign: "center" }} />
              </ListItem>
            )}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMoveDialogOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
