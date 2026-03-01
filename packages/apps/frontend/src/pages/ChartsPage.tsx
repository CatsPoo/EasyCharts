import { LockState, Permission, type Chart } from "@easy-charts/easycharts-types";
import CloseIcon from "@mui/icons-material/Close";
import HistoryIcon from "@mui/icons-material/History";
import NoteAddIcon from "@mui/icons-material/NoteAdd";
import {
  Alert,
  AppBar,
  Box,
  Button,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Switch,
  Tab,
  Tabs,
  TextField,
  Toolbar,
  Tooltip,
} from "@mui/material";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { RequirePermissions } from "../auth/RequirePermissions";
import { useAuth } from "../auth/useAuth";
import AssetTab from "../components/AssetsList/AssetTab";
import { ChartEditor } from "../components/ChartEditor/ChartEditor";
import type { ChartEditorHandle } from "../components/ChartEditor/interfaces/chartEditorHandle.interfaces";
import { DirectoryBrowserSidebar } from "../components/ChartEditor/DirectoryBrowserSidebar";
import { NavBar } from "../components/NavBar";
import { ThemeToggleButton } from "../components/ThemeToggleButton";
import { ChartHistoryPanel } from "../components/VersionHistory/ChartHistoryPanel";
import { useChartById } from "../hooks/chartsHooks";
import { useChartLock } from "../hooks/chartsLockHooks";
import { LockStatusChip } from "../components/ChartEditor/LockStatusClip";

export function ChartsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState(0);
  const [selectedId, setSelectedId] = useState<string>("");
  const [editMode, setEditMode] = useState(false);

  // dialog state:
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editChart, setEditChart] = useState<Chart | undefined>(undefined);
  const [editorMadeChanges, setEditorMadeChanges] = useState<boolean>(false);
  const [saving, setSaving] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);

  const chartEditorRef = useRef<ChartEditorHandle>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [saveNoteOpen, setSaveNoteOpen] = useState(false);
  const [saveNoteLabel, setSaveNoteLabel] = useState("");

  const {lock,state:lockState,lockChart,unlockChart,locking,unlocking,refetch,isLoading} = useChartLock(user!.id,selectedId || undefined)
  const readonly = false;

  const nope = useCallback(()=>{return} ,[])
  useEffect(() => {
    setSelectedId("");
  }, [tab]);

  const onEditChartdialogClose = useCallback(async ()=>{
    if(lockState === LockState.MINE) await unlockChart()
  },[lockState, unlockChart])


  const {
    data: selectedChart,
    isLoading: isSelectedChartLoading,
    error: selectedChartError,
  } = useChartById(selectedId ?? "");

  const onEditSwitchToggle = useCallback(async (checked:boolean)=>{
    try {
      if (checked) {
        await lockChart();
        setEditMode(true);
      } else {
        await unlockChart();
        setEditMode(false);
      }
    } catch (e) {
      // optional: toast error
      console.error(e);
    }
  },[lockChart, unlockChart])

  const handleEdit = (chartId: string) => {
    setSelectedId(chartId);
    setEditMode(false);
    setDialogOpen(true);
    setEditorMadeChanges(false);
  };

  useEffect(() => {
    if (dialogOpen && selectedChart) {
      setEditChart(structuredClone(selectedChart));
      setEditorMadeChanges(false);
    }
  }, [dialogOpen, selectedChart]);

  const handleDialogClose = async  () => {
    if (editorMadeChanges) {
      const leave = window.confirm(
        "You have unsaved changes. Are you sure you want to close without saving?"
      );
      if (!leave) {
        return;
      }
    }
    if(lockState === LockState.MINE) await unlockChart()
    setDialogOpen(false);
    setSelectedId("");
    setEditMode(false);
    setEditorMadeChanges(false);
    setEditChart(undefined);
  };

  async function handleSaveClick(versionLabel?: string) {
    if (!chartEditorRef.current) return;
    try {
      setSaving(true);
      const saved: Chart | null = await chartEditorRef.current.onSave(undefined, versionLabel);
      if( ! saved)
        throw new Error('Unable to save the chart')
      // do any parent-side updates you want
      await unlockChart()
      setEditMode(false);
      setDialogOpen(false);
      setEditorMadeChanges(false);
      setEditChart(undefined);
      setSelectedId(saved.id);
      setPreviewKey(k => k + 1);
    } catch (err) {
      console.error("updateChart failed:", err);
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveWithNote() {
    const label = saveNoteLabel.trim() || undefined;
    setSaveNoteOpen(false);
    setSaveNoteLabel("");
    await handleSaveClick(label);
  }
  
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        width: "100vw",
      }}
    >
      {/* Top tabs */}
      <NavBar>
        <div className="flex-1">
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            textColor="inherit"
            indicatorColor="secondary"
          >
            <Tab label="Charts" />
            <Tab label="Assets" />
          </Tabs>
        </div>
      </NavBar>

      <Box sx={{ display: "flex", flex: 1, minHeight: 0, overflow: "hidden" }}>
        <AnimatePresence initial={false}>
          {tab !== 1 && (
            <motion.div
              key="chart-sidebar"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 210, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              style={{ flexShrink: 0, overflow: "hidden", height: "100%" }}
            >
              <DirectoryBrowserSidebar
                onSelect={setSelectedId}
                onEdit={handleEdit}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {tab !== 1 ? (
          <Box sx={{ flex: 1, position: "relative" }}>
            {selectedChartError ? (
              <Box
                sx={{ height: "100%", display: "grid", placeItems: "center" }}
              >
                <Alert severity="error">
                  Failed to load chart: {String(selectedChartError)}
                </Alert>
              </Box>
            ) : isSelectedChartLoading ? (
              <Box
                sx={{ height: "100%", display: "grid", placeItems: "center" }}
              >
                <CircularProgress size={300} />
              </Box>
            ) : selectedChart ? (
              <ChartEditor
                key={`${selectedChart.id}-${previewKey}`}
                chart={selectedChart}
                setChart={nope}
                editMode={false}
                setMadeChanges={nope}
              />
            ) : (
              <Box
                sx={{ height: "100%", display: "grid", placeItems: "center" }}
              >
                Select a chart to preview
              </Box>
            )}
          </Box>
        ) : tab === 1 ? (
          <Box sx={{ flex: 1, minWidth: 0, minHeight: 0, display: "flex" }}>
            <AssetTab />
          </Box>
        ) : null}
      </Box>
      <Dialog fullScreen open={dialogOpen}>
        <AppBar position="relative">
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              onClick={() => handleDialogClose()}
              aria-label="close"
            >
              <CloseIcon />
            </IconButton>
            <div
              style={{
                position: "absolute",
                top: 14,
                right: 16,
                zIndex: 10,
                padding: 6,
                borderRadius: 4,
                height: 41,
              }}
            >
              <LockStatusChip
                lock={lock}
                lockState={lockState}
                isLoading={isLoading}
                locking={locking}
                unlocking={unlocking}
              />
              <RequirePermissions required={[Permission.CHART_UPDATE]}>
                {!readonly &&
                lockState !== LockState.OTHERs /* or OTHERs */ ? (
                  <FormControlLabel
                    sx={{
                      ml: 1,
                      px: 1,
                      borderRadius: 1,
                      bgcolor: "#7676c4",
                      color: "white",
                      "& .MuiFormControlLabel-label": { fontWeight: 600 },
                    }}
                    control={
                      <Switch
                        checked={editMode}
                        onChange={(e) => onEditSwitchToggle(e.target.checked)}
                        disabled={locking || unlocking}
                        color="default"
                      />
                    }
                    label={editMode ? "Edit Mode" : "View Mode"}
                  />
                ) : null}
              </RequirePermissions>
              <ThemeToggleButton />
            </div>
            {selectedId && (
              <Tooltip title="Version history">
                <IconButton color="inherit" onClick={() => setHistoryOpen(true)}>
                  <HistoryIcon />
                </IconButton>
              </Tooltip>
            )}
            {editMode && (
              <Box sx={{ display: "flex", gap: 1 }}>
                <Tooltip title="Save with a note">
                  <span>
                    <IconButton
                      color="inherit"
                      onClick={() => setSaveNoteOpen(true)}
                      disabled={saving || !editorMadeChanges}
                    >
                      <NoteAddIcon />
                    </IconButton>
                  </span>
                </Tooltip>
                <Button
                  color="success"
                  variant="contained"
                  onClick={() => handleSaveClick()}
                  disabled={saving || !editorMadeChanges}
                >
                  {saving ? "Saving…" : "Save"}
                </Button>
              </Box>
            )}
          </Toolbar>
        </AppBar>
        <Collapse in={!!lock && lockState !== LockState.UNLOCKED}>
          {lockState === LockState.MINE ? (
            <Alert severity="success" sx={{ borderRadius: 0 }}>
              You’re editing this chart. Others are in read-only mode.
            </Alert>
          ) : lockState === LockState.OTHERs ? (
            <Alert severity="warning" sx={{ borderRadius: 0 }}>
              This chart is locked by{" "}
              <strong>{lock?.lockedByName ?? "another user"}</strong>. You can
              view but cannot edit.
            </Alert>
          ) : null}
        </Collapse>

        {editChart && (
          <ChartEditor
            key={`edit-${editChart.id}-${editMode}`}
            chart={editChart}
            setChart={setEditChart}
            editMode={lockState !== LockState.OTHERs && editMode}
            setMadeChanges={setEditorMadeChanges}
            ref={chartEditorRef}
          />
        )}

        {/* Save with note dialog */}
        <Dialog open={saveNoteOpen} onClose={() => setSaveNoteOpen(false)} maxWidth="xs" fullWidth>
          <DialogTitle>Save with note</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              fullWidth
              size="small"
              label="Version note (optional)"
              placeholder="e.g. Before major restructure"
              value={saveNoteLabel}
              onChange={(e) => setSaveNoteLabel(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSaveWithNote()}
              sx={{ mt: 1 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSaveNoteOpen(false)}>Cancel</Button>
            <Button variant="contained" color="success" onClick={handleSaveWithNote}>
              Save
            </Button>
          </DialogActions>
        </Dialog>
      </Dialog>

      {/* Chart history panel */}
      {selectedId && (
        <ChartHistoryPanel
          chartId={selectedId}
          open={historyOpen}
          onClose={() => setHistoryOpen(false)}
          onRollbackSuccess={() => setPreviewKey((k) => k + 1)}
        />
      )}
    </Box>
  );
}
