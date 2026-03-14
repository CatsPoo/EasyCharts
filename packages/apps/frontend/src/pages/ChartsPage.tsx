import { LockState, Permission, type Chart, type ChartMetadata } from "@easy-charts/easycharts-types";
import CloseIcon from "@mui/icons-material/Close";
import HistoryIcon from "@mui/icons-material/History";
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
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Snackbar,
  Switch,
  Tab,
  Tabs,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
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
import { useThemeMode } from "../contexts/ThemeModeContext";

export function ChartsPage() {
  const { user } = useAuth();
  const { isDark } = useThemeMode();
  const [tab, setTab] = useState(0);
  const [selectedId, setSelectedId] = useState<string>("");
  const [editMode, setEditMode] = useState(false);
  const [selectedMetadata, setSelectedMetadata] = useState<ChartMetadata | undefined>(undefined);

  // dialog state:
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editChart, setEditChart] = useState<Chart | undefined>(undefined);
  const [editorMadeChanges, setEditorMadeChanges] = useState<boolean>(false);
  const [saving, setSaving] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);

  const chartEditorRef = useRef<ChartEditorHandle>(null);
  const intentionalUnlockRef = useRef(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [saveNoteOpen, setSaveNoteOpen] = useState(false);
  const [saveNoteLabel, setSaveNoteLabel] = useState("");
  const [unsavedDialogOpen, setUnsavedDialogOpen] = useState(false);
  const [saveErrorOpen, setSaveErrorOpen] = useState(false);
  const [lockAvailableOpen, setLockAvailableOpen] = useState(false);
  const [lockExpiredOpen, setLockExpiredOpen] = useState(false);

  const {lock,state:lockState,lockChart,unlockChart,refreshLock,locking,unlocking,isLoading} = useChartLock(user!.id,selectedId || undefined)

  const {
    data: selectedChart,
    isLoading: isSelectedChartLoading,
    error: selectedChartError,
  } = useChartById(selectedId ?? "");

  const prevLockStateRef = useRef<LockState | undefined>(undefined);
  useEffect(() => {
    const prev = prevLockStateRef.current;
    prevLockStateRef.current = lockState;

    if (!dialogOpen) return;

    if (prev === LockState.OTHERs && lockState === LockState.UNLOCKED) {
      setLockAvailableOpen(true);
    }

    if (prev === LockState.MINE && lockState === LockState.UNLOCKED) {
      if (intentionalUnlockRef.current) {
        intentionalUnlockRef.current = false;
        return;
      }
      // Lock was auto-released by the server — discard unsaved changes and exit edit mode
      setEditMode(false);
      setEditorMadeChanges(false);
      setEditChart(selectedChart ? structuredClone(selectedChart) : undefined);
      setLockExpiredOpen(true);
    }
  }, [lockState, dialogOpen, selectedChart]);
  const readonly = false;

  const nope = useCallback(()=>{return} ,[])

  // Ctrl+S saves the chart while the editor dialog is open and in edit mode
  useEffect(() => {
    if (!dialogOpen || !editMode) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (editorMadeChanges && !saving) setSaveNoteOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
   
  }, [dialogOpen, editMode, editorMadeChanges, saving]);

  useEffect(() => {
    setSelectedId("");
  }, [tab]);

  const onEditSwitchToggle = useCallback(async (checked:boolean)=>{
    try {
      if (checked) {
        await lockChart();
        setEditMode(true);
      } else {
        intentionalUnlockRef.current = true;
        await unlockChart();
        setEditMode(false);
      }
    } catch (e) {
      // optional: toast error
      console.error(e);
    }
  },[lockChart, unlockChart])

  const handleEdit = (chartId: string, metadata?: ChartMetadata) => {
    setSelectedId(chartId);
    setSelectedMetadata(metadata);
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

  const handleDialogClose = async () => {
    if (editorMadeChanges) {
      setUnsavedDialogOpen(true);
      return;
    }
    await doCloseDialog();
  };

  const doCloseDialog = async () => {
    if (lockState === LockState.MINE) await unlockChart();
    setDialogOpen(false);
    setSelectedId("");
    setEditMode(false);
    setEditorMadeChanges(false);
    setEditChart(undefined);
    setSelectedMetadata(undefined);
  };

  async function handleSaveClick(versionLabel?: string) {
    if (!chartEditorRef.current) return;
    try {
      setSaving(true);
      const saved: Chart | null = await chartEditorRef.current.onSave(undefined, versionLabel);
      if( ! saved)
        throw new Error('Unable to save the chart')
      // do any parent-side updates you want
      intentionalUnlockRef.current = true;
      await unlockChart()
      setEditMode(false);
      setDialogOpen(false);
      setEditorMadeChanges(false);
      setEditChart(undefined);
      setSelectedId(saved.id);
      setPreviewKey(k => k + 1);
    } catch (err) {
      console.error("updateChart failed:", err);
      setSaveErrorOpen(true);
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveWithNote() {
    const label = saveNoteLabel.trim();
    if (!label) return;
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
                <CircularProgress size={64} />
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
          <Toolbar sx={{ gap: 1 }}>
            {/* Left: close + chart name */}
            <IconButton
              edge="start"
              color="inherit"
              onClick={() => handleDialogClose()}
              aria-label="close"
            >
              <CloseIcon />
            </IconButton>
            <Typography variant="h6" sx={{ ml: 1, flex: 1, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>
              {editChart?.name ?? ""}
            </Typography>

            {/* Right: save actions, history, lock status, edit toggle, theme */}
            {editMode && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>
                {selectedId && (
                  <Tooltip title="Version history">
                    <IconButton color="inherit" onClick={() => setHistoryOpen(true)}>
                      <HistoryIcon />
                    </IconButton>
                  </Tooltip>
                )}
                <Button
                  color="success"
                  variant="contained"
                  onClick={() => setSaveNoteOpen(true)}
                  disabled={saving || !editorMadeChanges}
                >
                  {saving ? "Saving…" : "Save"}
                </Button>
              </Box>
            )}

            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexShrink: 0 }}>
              <LockStatusChip
                lock={lock}
                lockState={lockState}
                isLoading={isLoading}
                locking={locking}
                unlocking={unlocking}
              />
              <RequirePermissions required={[Permission.CHART_UPDATE]}>
                {!readonly && lockState !== LockState.OTHERs && selectedMetadata?.myPrivileges?.canEdit !== false ? (
                  <FormControlLabel
                    sx={{
                      ml: 1,
                      px: 1,
                      borderRadius: 1,
                      bgcolor: isDark ? "#5252a3" : "#7676c4",
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
            </Box>
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
            setMadeChanges={(v) => { setEditorMadeChanges(v); if (v && lockState === LockState.MINE) refreshLock(); }}
            ref={chartEditorRef}
          />
        )}

        {/* Save with note dialog */}
        <Dialog open={saveNoteOpen} onClose={() => { setSaveNoteOpen(false); setSaveNoteLabel(""); }} maxWidth="xs" fullWidth>
          <DialogTitle>Save with note</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              fullWidth
              required
              size="small"
              label="Version note"
              placeholder="e.g. Before major restructure"
              value={saveNoteLabel}
              onChange={(e) => setSaveNoteLabel(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSaveWithNote()}
              sx={{ mt: 1 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => { setSaveNoteOpen(false); setSaveNoteLabel(""); }}>Cancel</Button>
            <Button variant="contained" color="success" onClick={handleSaveWithNote} disabled={!saveNoteLabel.trim()}>
              Save
            </Button>
          </DialogActions>
        </Dialog>

        {/* Unsaved changes confirmation dialog */}
        <Dialog open={unsavedDialogOpen} onClose={() => setUnsavedDialogOpen(false)} maxWidth="xs" fullWidth>
          <DialogTitle>Unsaved changes</DialogTitle>
          <DialogContent>
            <DialogContentText>
              You have unsaved changes. Are you sure you want to close without saving?
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setUnsavedDialogOpen(false)}>Keep editing</Button>
            <Button variant="contained" color="error" onClick={async () => { setUnsavedDialogOpen(false); await doCloseDialog(); }}>
              Discard & close
            </Button>
          </DialogActions>
        </Dialog>

        {/* Chart history panel — must live inside the fullscreen Dialog so the Drawer stacks above it */}
        {selectedId && (
          <ChartHistoryPanel
            chartId={selectedId}
            open={historyOpen}
            onClose={() => setHistoryOpen(false)}
            onRollbackSuccess={() => {
              setHistoryOpen(false);
              setDialogOpen(false);
              setEditMode(false);
              setEditorMadeChanges(false);
              setEditChart(undefined);
              setPreviewKey((k) => k + 1);
            }}
          />
        )}
      </Dialog>

      {/* Save error feedback */}
      <Snackbar
        open={saveErrorOpen}
        autoHideDuration={5000}
        onClose={() => setSaveErrorOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="error" onClose={() => setSaveErrorOpen(false)} sx={{ width: "100%" }}>
          Failed to save the chart. Please try again.
        </Alert>
      </Snackbar>

      {/* Lock expired feedback (own lock auto-released) */}
      <Snackbar
        open={lockExpiredOpen}
        autoHideDuration={8000}
        onClose={() => setLockExpiredOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="warning" onClose={() => setLockExpiredOpen(false)} sx={{ width: "100%" }}>
          Your edit lock expired due to inactivity. Unsaved changes were discarded.
        </Alert>
      </Snackbar>

      {/* Lock available feedback */}
      <Snackbar
        open={lockAvailableOpen}
        autoHideDuration={8000}
        onClose={() => setLockAvailableOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="info" onClose={() => setLockAvailableOpen(false)} sx={{ width: "100%" }}>
          The chart is now available — you can switch to edit mode.
        </Alert>
      </Snackbar>
    </Box>
  );
}
