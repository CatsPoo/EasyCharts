import { LockState, Permission, type Chart } from "@easy-charts/easycharts-types";
import CloseIcon from "@mui/icons-material/Close";
import {
  Alert,
  AppBar,
  Button,
  CircularProgress,
  Dialog,
  FormControlLabel,
  IconButton,
  Switch,
  Tab,
  Tabs,
  Toolbar,
} from "@mui/material";
import Box from "@mui/material/Box";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import AssetTab from "../components/AssetsList/AssetTab";
import type { ChartEditorHandle } from "../components/ChartEditor/interfaces/chartEditorHandle.interfaces";
import { ChartListSidebar } from "../components/ChartsViewer/ChartListSideBar";
import { NavBar } from "../components/NavBar";
import { ThemeToggleButton } from "../components/ThemeToggleButton";
import { ChartEditor } from "../components/ChartEditor/ChartEditor";
import { useAuth } from "../auth/useAuth";
import { RequirePermissions } from "../auth/RequirePermissions";
import { useChartLock } from "../hooks/chartsLockHooks";
import { useChartById } from "../hooks/chartsHooks";

export function ChartsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState(0);
  const [selectedId, setSelectedId] = useState<string>("");
  const [editMode, setEditMode] = useState(false);

  // dialog state:
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editChart, setEditChart] = useState<Chart | undefined>(undefined);
  const [editorMageChanges, setEditorMadeChanges] = useState<boolean>(false);
  const [saving, setSaving] = useState(false);

  const chartEditorRef = useRef<ChartEditorHandle>(null);

  const {lock,lockChart,unlockChart,locking,unlocking,refetch,isLoading} = useChartLock(selectedId)
  const readonly = false;

  const nope = useCallback(()=>{return} ,[])
  useEffect(() => {
    setSelectedId("");
  }, [tab]);

  const onEditChartdialogClose = useCallback(async ()=>{
    if(editChart?.id) await unlockChart()
    setDialogOpen(false)
  },[editChart?.id, unlockChart])


  const {
    data: selectedChart,
    isLoading: isSelectedChartLoading,
    error: selectedChartError,
  } = useChartById(selectedId ?? "");

  const onEditSwitchToggle = useCallback((newVal:boolean)=>{
    setEditMode(newVal)
    if(editChart?.id && newVal) lockChart()
  },[editChart?.id, lockChart])

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
    if (editorMageChanges) {
      const leave = window.confirm(
        "You have unsaved changes. Are you sure you want to close without saving?"
      );
      if (!leave) {
        return;
      }
    }
    if(editChart?.id) await unlockChart(editChart?.id)
    setDialogOpen(false);
    setSelectedId("");
    setEditMode(false);
    setEditorMadeChanges(false);
    setEditChart(undefined);
  };

  async function handleSaveClick() {
    if (!chartEditorRef.current) return;
    try {
      setSaving(true);
      const saved: Chart | null = await chartEditorRef.current.onSave();
      if( ! saved)
        throw new Error('Unable to save the chart')
      // do any parent-side updates you want
      setSelectedId(saved.id);
      setDialogOpen(false);
      setEditorMadeChanges(false);
      setEditChart(undefined);
    } catch (err) {
      console.error("updateChart failed:", err);
    } finally {
      setSaving(false);
    }
  }
  
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        width: "100Vw",
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
            <Tab label="My Charts" />
            <Tab label="Shared Charts" />
            <Tab label="Assets" />
          </Tabs>
        </div>
      </NavBar>

      <Box sx={{ display: "flex", flex: 1 }}>
        <AnimatePresence initial={false}>
          {tab !== 2 && (
            <motion.div
              key="chart-sidebar"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 210, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="flex-none overflow-hidden border-r
             border-slate-200 dark:border-slate-700
             bg-transparent dark:bg-slate-900
             transition-colors duration-200"
            >
              <ChartListSidebar
                isMyCharts={tab === 0}
                onSelect={setSelectedId}
                onEdit={handleEdit}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {tab !== 2 ? (
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
                key={selectedChart.id}
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
        ) : (
          <Box sx={{ flex: 1, minWidth: 0, minHeight: 0, display: "flex" }}>
            <AssetTab />
          </Box>
        )}
      </Box>
      <Dialog fullScreen open={dialogOpen} onClose={onEditChartdialogClose}>
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
              <RequirePermissions required={[Permission.CHART_UPDATE]}>
                {!readonly && lock.state !== LockState.OTHERs ? (
                  <FormControlLabel
                    style={{ background: "#7676c4" }}
                    control={
                      <Switch
                        checked={editMode}
                        onChange={(e) => onEditSwitchToggle(e.target.checked)}
                        color="primary"
                      />
                    }
                    label={editMode ? "Edit Mode" : "View Mode"}
                  />
                ) : null}
              </RequirePermissions>
              <ThemeToggleButton />
            </div>
            {editMode && (
              <Button
                color="success"
                variant="contained"
                onClick={handleSaveClick}
                disabled={saving || !editorMageChanges}
              >
                {saving ? "Saving…" : "Save"}
              </Button>
            )}
          </Toolbar>
        </AppBar>

        {editChart && (
          <ChartEditor
            key={`edit-${editChart.id}-${editMode}`}
            chart={editChart}
            setChart={setEditChart}
            editMode={lock.state !== LockState.OTHERs && editMode}
            setMadeChanges={setEditorMadeChanges}
            ref={chartEditorRef}
          />
        )}
      </Dialog>
    </Box>
  );
}
