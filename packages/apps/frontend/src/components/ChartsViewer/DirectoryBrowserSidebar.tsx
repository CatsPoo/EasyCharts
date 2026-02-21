import { Permission, type ChartMetadata } from "@easy-charts/easycharts-types";
import AddIcon from "@mui/icons-material/Add";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import DriveFileMoveIcon from "@mui/icons-material/DriveFileMove";
import FolderIcon from "@mui/icons-material/Folder";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import InboxIcon from "@mui/icons-material/Inbox";
import ShareIcon from "@mui/icons-material/Share";
import {
  Box,
  Breadcrumbs,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  LinearProgress,
  Link,
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
import { useCallback, useState } from "react";
import { RequirePermissions } from "../../auth/RequirePermissions";
import type { ChartCreate } from "@easy-charts/easycharts-types";
import {
  useCreateChartMutation,
  useDeleteChartMutation,
} from "../../hooks/chartsHooks";
import {
  useAddChartToDirectoryMutation,
  useChildDirectoriesQuery,
  useCreateDirectoryMutation,
  useDeleteDirectoryMutation,
  useDirectoryChartsMetadataQuery,
  useRemoveChartFromDirectoryMutation,
  useRootDirectoriesQuery,
  useUnassignedChartsQuery,
  useUpdateDirectoryMutation,
} from "../../hooks/chartsDirectoriesHooks";
import { ConfirmDialog } from "../DeleteAlertDialog";
import { CreateChartDialog } from "../CreateChartDialog";
import { ShareChartDialog } from "./ShareChartDialog";
import { ShareDirectoryDialog } from "./ShareDirectoryDialog";

interface DirectoryBrowserSidebarProps {
  onSelect: (chartId: string) => void;
  onEdit: (chartId: string) => void;
}

type NavEntry = { id: string; name: string };

export function DirectoryBrowserSidebar({ onSelect, onEdit }: DirectoryBrowserSidebarProps) {
  // ── Navigation ─────────────────────────────────────────────────────────────
  // navStack: empty = root; top entry = current directory
  const [navStack, setNavStack] = useState<NavEntry[]>([]);
  const [showUnassigned, setShowUnassigned] = useState(false);
  const currentDir = navStack.at(-1) ?? null;
  const isAtRoot = navStack.length === 0 && !showUnassigned;
  const isInsideDir = navStack.length > 0 && !showUnassigned;

  // ── State ──────────────────────────────────────────────────────────────────
  const [deleteChartDialogOpen, setDeleteChartDialogOpen] = useState(false);
  const [pendingChartToDelete, setPendingChartToDelete] = useState("");

  const [deleteDirDialogOpen, setDeleteDirDialogOpen] = useState(false);
  const [pendingDirToDelete, setPendingDirToDelete] = useState("");

  const [createChartOpen, setCreateChartOpen] = useState(false);

  const [createDirOpen, setCreateDirOpen] = useState(false);
  const [newDirName, setNewDirName] = useState("");

  const [contextMenu, setContextMenu] = useState<{ mouseX: number; mouseY: number; chartId: string } | null>(null);

  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [pendingChartToMove, setPendingChartToMove] = useState("");
  const [pendingChartSourceDirId, setPendingChartSourceDirId] = useState<string | null>(null);
  // Move dialog has its own internal navigation stack
  const [moveNavStack, setMoveNavStack] = useState<NavEntry[]>([]);
  const moveCurrentDir = moveNavStack.at(-1) ?? null;

  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [pendingChartToShare, setPendingChartToShare] = useState("");

  const [dirContextMenu, setDirContextMenu] = useState<{ mouseX: number; mouseY: number; dirId: string } | null>(null);

  const [shareDirDialogOpen, setShareDirDialogOpen] = useState(false);
  const [pendingDirToShare, setPendingDirToShare] = useState("");

  // Move directory dialog state
  const [moveDirDialogOpen, setMoveDirDialogOpen] = useState(false);
  const [pendingDirToMove, setPendingDirToMove] = useState("");
  const [moveDirNavStack, setMoveDirNavStack] = useState<NavEntry[]>([]);
  const moveDirCurrentDir = moveDirNavStack.at(-1) ?? null;

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: rootDirs, isLoading: rootDirsLoading } = useRootDirectoriesQuery();
  // Children of current directory (main nav)
  const { data: childDirs, isLoading: childDirsLoading } = useChildDirectoriesQuery(
    isInsideDir ? currentDir!.id : null,
  );
  const { data: dirCharts, isLoading: dirChartsLoading } = useDirectoryChartsMetadataQuery(
    isInsideDir ? currentDir!.id : null,
  );
  const { data: unassignedCharts, isLoading: unassignedLoading } = useUnassignedChartsQuery();
  // Children for chart move-dialog navigation
  const { data: moveDirChildren } = useChildDirectoriesQuery(moveCurrentDir?.id ?? null);
  // Children for directory move-dialog navigation (separate query)
  const { data: moveDirDialogChildren } = useChildDirectoriesQuery(moveDirCurrentDir?.id ?? null);

  // ── Mutations ──────────────────────────────────────────────────────────────
  const createChartMutation = useCreateChartMutation();
  const deleteChartMutation = useDeleteChartMutation();
  const addChartToDirectoryMutation = useAddChartToDirectoryMutation();
  const removeChartFromDirectoryMutation = useRemoveChartFromDirectoryMutation();
  const createDirMutation = useCreateDirectoryMutation();
  const deleteDirMutation = useDeleteDirectoryMutation();
  const updateDirectoryMutation = useUpdateDirectoryMutation();

  // ── Navigation handlers ────────────────────────────────────────────────────
  const handleOpenDirectory = useCallback((id: string, name: string) => {
    setNavStack((prev) => [...prev, { id, name }]);
    setShowUnassigned(false);
    onSelect("");
  }, [onSelect]);

  const handleOpenUnassigned = useCallback(() => {
    setShowUnassigned(true);
    setNavStack([]);
    onSelect("");
  }, [onSelect]);

  const handleBack = useCallback(() => {
    if (showUnassigned) {
      setShowUnassigned(false);
    } else {
      setNavStack((prev) => prev.slice(0, -1));
    }
    onSelect("");
  }, [showUnassigned, onSelect]);

  const handleBreadcrumbNavigate = useCallback((index: number) => {
    // index = -1 → root; index >= 0 → that stack entry
    if (index < 0) {
      setNavStack([]);
    } else {
      setNavStack((prev) => prev.slice(0, index + 1));
    }
    onSelect("");
  }, [onSelect]);

  // ── Create handlers ────────────────────────────────────────────────────────
  const handleCreateChart = useCallback(async (dto: ChartCreate) => {
    const newChart = await createChartMutation.mutateAsync(dto);
    if (currentDir?.id) {
      await addChartToDirectoryMutation.mutateAsync({ directoryId: currentDir.id, chartId: newChart.id });
    }
    setCreateChartOpen(false);
  }, [createChartMutation, addChartToDirectoryMutation, currentDir]);

  const handleCreateDirectory = useCallback(async () => {
    if (!newDirName.trim()) return;
    // parentId = current directory (or null for root)
    await createDirMutation.mutateAsync({ name: newDirName.trim(), parentId: currentDir?.id ?? null, description: "" });
    setNewDirName("");
    setCreateDirOpen(false);
  }, [createDirMutation, newDirName, currentDir]);

  // ── Delete handlers ────────────────────────────────────────────────────────
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
    const idToDelete = pendingDirToDelete;
    deleteDirMutation.mutateAsync(idToDelete).then(() => {
      // If the deleted directory is in our nav stack, pop back to before it
      const idx = navStack.findIndex((e) => e.id === idToDelete);
      if (idx >= 0) setNavStack((prev) => prev.slice(0, idx));
    });
    setPendingDirToDelete("");
    setDeleteDirDialogOpen(false);
  }, [deleteDirMutation, pendingDirToDelete, navStack]);

  // ── Chart context menu handlers ────────────────────────────────────────────
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
    setPendingChartSourceDirId(currentDir?.id ?? null); // snapshot at right-click time
    setMoveNavStack([]); // reset move dialog to root
    setMoveDialogOpen(true);
    setContextMenu(null);
  }, [contextMenu, currentDir]);

  const handleContextMenuShare = useCallback(() => {
    if (!contextMenu) return;
    setPendingChartToShare(contextMenu.chartId);
    setShareDialogOpen(true);
    setContextMenu(null);
  }, [contextMenu]);

  const handleMoveToDirectory = useCallback(async (targetDirId: string) => {
    if (pendingChartSourceDirId) {
      await removeChartFromDirectoryMutation.mutateAsync({
        directoryId: pendingChartSourceDirId,
        chartId: pendingChartToMove,
      });
    }
    await addChartToDirectoryMutation.mutateAsync({ directoryId: targetDirId, chartId: pendingChartToMove });
    setPendingChartToMove("");
    setPendingChartSourceDirId(null);
    setMoveDialogOpen(false);
  }, [pendingChartSourceDirId, pendingChartToMove, removeChartFromDirectoryMutation, addChartToDirectoryMutation]);

  const handleMakeUnassigned = useCallback(async () => {
    if (!pendingChartSourceDirId) return;
    await removeChartFromDirectoryMutation.mutateAsync({
      directoryId: pendingChartSourceDirId,
      chartId: pendingChartToMove,
    });
    setPendingChartToMove("");
    setPendingChartSourceDirId(null);
    setMoveDialogOpen(false);
  }, [pendingChartSourceDirId, pendingChartToMove, removeChartFromDirectoryMutation]);

  // ── Directory context menu handlers ────────────────────────────────────────
  const handleDirContextMenu = useCallback((e: React.MouseEvent, dirId: string) => {
    e.preventDefault();
    setDirContextMenu({ mouseX: e.clientX, mouseY: e.clientY, dirId });
  }, []);

  const handleDirContextMenuClose = useCallback(() => setDirContextMenu(null), []);

  const handleDirContextMenuShare = useCallback(() => {
    if (!dirContextMenu) return;
    setPendingDirToShare(dirContextMenu.dirId);
    setShareDirDialogOpen(true);
    setDirContextMenu(null);
  }, [dirContextMenu]);

  const handleDirContextMenuDelete = useCallback(() => {
    if (!dirContextMenu) return;
    handleDeleteDir(dirContextMenu.dirId);
    setDirContextMenu(null);
  }, [dirContextMenu, handleDeleteDir]);

  const handleMoveDirClick = useCallback((dirId: string) => {
    setPendingDirToMove(dirId);
    setMoveDirNavStack([]);
    setMoveDirDialogOpen(true);
  }, []);

  const handleDirContextMenuMove = useCallback(() => {
    if (!dirContextMenu) return;
    handleMoveDirClick(dirContextMenu.dirId);
    setDirContextMenu(null);
  }, [dirContextMenu, handleMoveDirClick]);

  const handleMoveDirToTarget = useCallback(async (targetParentId: string | null) => {
    await updateDirectoryMutation.mutateAsync({ id: pendingDirToMove, data: { parentId: targetParentId } });
    setPendingDirToMove("");
    setMoveDirDialogOpen(false);
  }, [updateDirectoryMutation, pendingDirToMove]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const isLoading =
    (isAtRoot && rootDirsLoading) ||
    (isInsideDir && (childDirsLoading || dirChartsLoading)) ||
    (showUnassigned && unassignedLoading);

  const dirsToShow = isInsideDir ? (childDirs ?? []) : isAtRoot ? (rootDirs ?? []) : [];
  const chartsToShow: ChartMetadata[] = isInsideDir
    ? (dirCharts ?? [])
    : showUnassigned
    ? (unassignedCharts ?? [])
    : [];
  // Chart move dialog: children of currently-navigated dir, or root dirs
  const dirsForMoveDialog = moveCurrentDir ? (moveDirChildren ?? []) : (rootDirs ?? []);
  // Directory move dialog: same but exclude the directory being moved (can't move into itself)
  const dirsForMoveDirDialog = (moveDirCurrentDir ? (moveDirDialogChildren ?? []) : (rootDirs ?? []))
    .filter((d) => d.id !== pendingDirToMove);

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

  if (isLoading) return <LinearProgress />;

  return (
    <Box sx={sidebarSx}>
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      {isAtRoot ? (
        <Box sx={{ px: 1.5, pt: 1.5, pb: 0.5 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={600} letterSpacing={1}>
            DIRECTORIES
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: "flex", alignItems: "center", px: 1, pt: 0.5, minHeight: 40, gap: 0.5, overflow: "hidden" }}>
          <IconButton size="small" onClick={handleBack} sx={{ flexShrink: 0 }}>
            <ArrowBackIosIcon fontSize="small" />
          </IconButton>

          {showUnassigned ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <InboxIcon fontSize="small" color="action" />
              <Typography variant="caption" fontWeight={600} noWrap>Unassigned Charts</Typography>
            </Box>
          ) : (
            // Breadcrumb trail: Root > Ancestor1 > Ancestor2 > CurrentDir
            <Breadcrumbs
              maxItems={4}
              sx={{ fontSize: 12, minWidth: 0, "& .MuiBreadcrumbs-ol": { flexWrap: "nowrap" } }}
            >
              <Link
                component="button"
                variant="caption"
                underline="hover"
                onClick={() => handleBreadcrumbNavigate(-1)}
                sx={{ cursor: "pointer", color: "text.secondary" }}
              >
                Root
              </Link>
              {navStack.slice(0, -1).map((entry, i) => (
                <Link
                  key={entry.id}
                  component="button"
                  variant="caption"
                  underline="hover"
                  onClick={() => handleBreadcrumbNavigate(i)}
                  sx={{ cursor: "pointer", color: "text.secondary" }}
                >
                  {entry.name}
                </Link>
              ))}
              <Typography variant="caption" fontWeight={600} noWrap color="text.primary">
                {currentDir?.name}
              </Typography>
            </Breadcrumbs>
          )}
        </Box>
      )}

      {/* ── List ────────────────────────────────────────────────────────────── */}
      <List dense sx={{ flex: 1, overflowY: "auto" }}>
        {/* Unassigned shortcut (root only) */}
        {isAtRoot && (
          <ListItem disablePadding>
            <ListItemButton onClick={handleOpenUnassigned}>
              <ListItemIcon sx={{ minWidth: 32 }}>
                <InboxIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Unassigned Charts" primaryTypographyProps={{ fontSize: 13 }} />
            </ListItemButton>
          </ListItem>
        )}

        {/* Directory rows */}
        {!showUnassigned && dirsToShow.map((dir) => (
          <ListItem
            key={dir.id}
            disablePadding
            onContextMenu={(e) => handleDirContextMenu(e, dir.id)}
          >
            <ListItemButton onClick={() => handleOpenDirectory(dir.id, dir.name)}>
              <ListItemIcon sx={{ minWidth: 32 }}>
                <FolderIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={dir.name} primaryTypographyProps={{ fontSize: 13 }} />
              <ArrowForwardIosIcon sx={{ fontSize: 12, color: "text.disabled", ml: 0.5 }} />
            </ListItemButton>
          </ListItem>
        ))}

        {/* Divider between subdirs and charts (inside dir only) */}
        {isInsideDir && dirsToShow.length > 0 && chartsToShow.length > 0 && (
          <Divider sx={{ my: 0.5 }} />
        )}

        {/* Chart rows */}
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

        {/* Empty states */}
        {isAtRoot && (rootDirs ?? []).length === 0 && (
          <ListItem>
            <ListItemText
              secondary="No directories yet. Right-click the + button below."
              secondaryTypographyProps={{ fontSize: 12, textAlign: "center" }}
            />
          </ListItem>
        )}
        {isInsideDir && dirsToShow.length === 0 && chartsToShow.length === 0 && (
          <ListItem>
            <ListItemText
              secondary="Empty directory"
              secondaryTypographyProps={{ fontSize: 12, textAlign: "center" }}
            />
          </ListItem>
        )}
        {showUnassigned && chartsToShow.length === 0 && (
          <ListItem>
            <ListItemText
              secondary="No unassigned charts"
              secondaryTypographyProps={{ fontSize: 12, textAlign: "center" }}
            />
          </ListItem>
        )}
      </List>

      {/* ── FAB (root + inside-dir) ──────────────────────────────────────────── */}
      {(isAtRoot || isInsideDir) && (
        <RequirePermissions required={[Permission.CHART_CREATE]}>
          <SpeedDial
            ariaLabel="Create"
            icon={<SpeedDialIcon />}
            sx={{ position: "fixed", right: 16, bottom: 16, zIndex: 1300 }}
            FabProps={{ size: "small", color: "primary" }}
          >
            <SpeedDialAction
              icon={<FolderIcon fontSize="small" />}
              tooltipTitle={isInsideDir ? "New subdirectory" : "New directory"}
              tooltipOpen
              onClick={() => setCreateDirOpen(true)}
            />
            <SpeedDialAction
              icon={<AddIcon fontSize="small" />}
              tooltipTitle={isInsideDir ? "New chart here" : "New unassigned chart"}
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
      )}

      {/* ── Create directory inline prompt ──────────────────────────────────── */}
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
            placeholder={isInsideDir ? "Subdirectory name" : "Directory name"}
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

      {/* ── Confirm: delete chart ────────────────────────────────────────────── */}
      <ConfirmDialog
        open={deleteChartDialogOpen}
        onCancel={() => { setDeleteChartDialogOpen(false); setPendingChartToDelete(""); }}
        onConfirm={handleConfirmDeleteChart}
        confirmText="Delete"
        confirmColor="error"
        description="Permanently delete this chart?"
        cancelText="Cancel"
      />

      {/* ── Confirm: delete directory ────────────────────────────────────────── */}
      <ConfirmDialog
        open={deleteDirDialogOpen}
        onCancel={() => { setDeleteDirDialogOpen(false); setPendingDirToDelete(""); }}
        onConfirm={handleConfirmDeleteDir}
        confirmText="Delete"
        confirmColor="error"
        description="Permanently delete this directory? Subdirectories will become root-level and charts inside will become unassigned."
        cancelText="Cancel"
      />

      {/* ── Chart context menu ───────────────────────────────────────────────── */}
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
        <MenuItem onClick={handleContextMenuShare}>
          <ListItemIcon><ShareIcon fontSize="small" /></ListItemIcon>
          Share
        </MenuItem>
        <Divider />
        <RequirePermissions required={[Permission.CHART_DELETE]}>
          <MenuItem onClick={handleContextMenuDelete} sx={{ color: "error.main" }}>
            <ListItemIcon><DeleteForeverIcon fontSize="small" color="error" /></ListItemIcon>
            Delete chart
          </MenuItem>
        </RequirePermissions>
      </Menu>

      {/* ── Directory context menu ───────────────────────────────────────────── */}
      <Menu
        open={dirContextMenu !== null}
        onClose={handleDirContextMenuClose}
        anchorReference="anchorPosition"
        anchorPosition={dirContextMenu ? { top: dirContextMenu.mouseY, left: dirContextMenu.mouseX } : undefined}
      >
        <MenuItem onClick={handleDirContextMenuMove}>
          <ListItemIcon><DriveFileMoveIcon fontSize="small" /></ListItemIcon>
          Move to…
        </MenuItem>
        <MenuItem onClick={handleDirContextMenuShare}>
          <ListItemIcon><ShareIcon fontSize="small" /></ListItemIcon>
          Share
        </MenuItem>
        <Divider />
        <RequirePermissions required={[Permission.CHART_DELETE]}>
          <MenuItem onClick={handleDirContextMenuDelete} sx={{ color: "error.main" }}>
            <ListItemIcon><DeleteForeverIcon fontSize="small" color="error" /></ListItemIcon>
            Delete directory
          </MenuItem>
        </RequirePermissions>
      </Menu>

      {/* ── Move chart dialog ────────────────────────────────────────────────── */}
      <Dialog open={moveDialogOpen} onClose={() => setMoveDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, pb: 1 }}>
          {moveNavStack.length > 0 && (
            <IconButton size="small" onClick={() => setMoveNavStack((prev) => prev.slice(0, -1))}>
              <ArrowBackIosIcon fontSize="small" />
            </IconButton>
          )}
          <Typography variant="subtitle1" sx={{ flex: 1 }}>
            {moveCurrentDir ? `Inside "${moveCurrentDir.name}"` : "Move chart to…"}
          </Typography>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          <List dense>
            {/* "Move into current dir" button (shown when navigated into a sub-dir) */}
            {moveCurrentDir && (
              <>
                <ListItem disablePadding>
                  <ListItemButton
                    onClick={() => handleMoveToDirectory(moveCurrentDir.id)}
                    disabled={removeChartFromDirectoryMutation.isPending || addChartToDirectoryMutation.isPending}
                  >
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <FolderOpenIcon fontSize="small" color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={`Move into "${moveCurrentDir.name}"`}
                      primaryTypographyProps={{ fontStyle: "italic", fontSize: 13 }}
                    />
                  </ListItemButton>
                </ListItem>
                <Divider />
              </>
            )}

            {/* Unassigned option (only if chart is currently in a directory) */}
            {pendingChartSourceDirId && (
              <>
                <ListItem disablePadding>
                  <ListItemButton
                    onClick={handleMakeUnassigned}
                    disabled={removeChartFromDirectoryMutation.isPending}
                  >
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <InboxIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Unassigned (no directory)"
                      primaryTypographyProps={{ fontStyle: "italic", fontSize: 13 }}
                    />
                  </ListItemButton>
                </ListItem>
                <Divider />
              </>
            )}

            {/* Directory rows: click = move here; arrow = navigate into */}
            {dirsForMoveDialog.map((dir) => (
              <ListItem
                key={dir.id}
                disablePadding
                secondaryAction={
                  <Tooltip title="Navigate into">
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={() => setMoveNavStack((prev) => [...prev, { id: dir.id, name: dir.name }])}
                    >
                      <ArrowForwardIosIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                }
              >
                <ListItemButton
                  onClick={() => handleMoveToDirectory(dir.id)}
                  disabled={removeChartFromDirectoryMutation.isPending || addChartToDirectoryMutation.isPending}
                >
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <FolderIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary={dir.name} primaryTypographyProps={{ fontSize: 13 }} />
                </ListItemButton>
              </ListItem>
            ))}

            {dirsForMoveDialog.length === 0 && (
              <ListItem>
                <ListItemText
                  secondary={moveCurrentDir ? "No subdirectories" : "No directories available"}
                  secondaryTypographyProps={{ textAlign: "center" }}
                />
              </ListItem>
            )}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMoveDialogOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* ── Move directory dialog ───────────────────────────────────────────── */}
      <Dialog open={moveDirDialogOpen} onClose={() => setMoveDirDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, pb: 1 }}>
          {moveDirNavStack.length > 0 && (
            <IconButton size="small" onClick={() => setMoveDirNavStack((prev) => prev.slice(0, -1))}>
              <ArrowBackIosIcon fontSize="small" />
            </IconButton>
          )}
          <Typography variant="subtitle1" sx={{ flex: 1 }}>
            {moveDirCurrentDir ? `Inside "${moveDirCurrentDir.name}"` : "Move directory to…"}
          </Typography>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          <List dense>
            {/* Move to root level */}
            {!moveDirCurrentDir && (
              <>
                <ListItem disablePadding>
                  <ListItemButton
                    onClick={() => handleMoveDirToTarget(null)}
                    disabled={updateDirectoryMutation.isPending}
                  >
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <FolderOpenIcon fontSize="small" color="action" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Root level (no parent)"
                      primaryTypographyProps={{ fontStyle: "italic", fontSize: 13 }}
                    />
                  </ListItemButton>
                </ListItem>
                <Divider />
              </>
            )}

            {/* "Move into current dir" when navigated inside */}
            {moveDirCurrentDir && (
              <>
                <ListItem disablePadding>
                  <ListItemButton
                    onClick={() => handleMoveDirToTarget(moveDirCurrentDir.id)}
                    disabled={updateDirectoryMutation.isPending}
                  >
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <FolderOpenIcon fontSize="small" color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={`Move into "${moveDirCurrentDir.name}"`}
                      primaryTypographyProps={{ fontStyle: "italic", fontSize: 13 }}
                    />
                  </ListItemButton>
                </ListItem>
                <Divider />
              </>
            )}

            {/* Directory rows: click = move here; arrow = navigate into */}
            {dirsForMoveDirDialog.map((dir) => (
              <ListItem
                key={dir.id}
                disablePadding
                secondaryAction={
                  <Tooltip title="Navigate into">
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={() => setMoveDirNavStack((prev) => [...prev, { id: dir.id, name: dir.name }])}
                    >
                      <ArrowForwardIosIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                }
              >
                <ListItemButton
                  onClick={() => handleMoveDirToTarget(dir.id)}
                  disabled={updateDirectoryMutation.isPending}
                >
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <FolderIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary={dir.name} primaryTypographyProps={{ fontSize: 13 }} />
                </ListItemButton>
              </ListItem>
            ))}

            {dirsForMoveDirDialog.length === 0 && moveDirCurrentDir && (
              <ListItem>
                <ListItemText
                  secondary="No subdirectories"
                  secondaryTypographyProps={{ textAlign: "center" }}
                />
              </ListItem>
            )}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMoveDirDialogOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* ── Share chart dialog ───────────────────────────────────────────────── */}
      <ShareChartDialog
        open={shareDialogOpen}
        onClose={() => { setShareDialogOpen(false); setPendingChartToShare(""); }}
        chartId={pendingChartToShare}
      />

      {/* ── Share directory dialog ───────────────────────────────────────────── */}
      <ShareDirectoryDialog
        open={shareDirDialogOpen}
        onClose={() => { setShareDirDialogOpen(false); setPendingDirToShare(""); }}
        directoryId={pendingDirToShare}
      />
    </Box>
  );
}
