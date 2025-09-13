import { type Chart } from "@easy-charts/easycharts-types";
import CloseIcon from "@mui/icons-material/Close";
import {
  AppBar,
  Button,
  Dialog,
  FormControlLabel,
  IconButton,
  Switch,
  Toolbar,
} from "@mui/material";
import Box from "@mui/material/Box";
import { AnimatePresence, motion } from "framer-motion";
import * as React from "react";
import { useEffect, useState } from "react";
import AssetTab from "../components/AssetsList/AssetTab";
import type { ChartEditorHandle } from "../components/ChartEditor/interfaces/chartEditorHandle.interfaces";
import { ChartListSidebar } from "../components/ChartsViewer/ChartListSideBar";
import { NavBar } from "../components/NavBar";
import { ThemeToggleButton } from "../components/ThemeToggleButton";
import { useChartById } from "../hooks/chartsHooks";
import { ChartEditor } from "../components/ChartEditor/ChartEditor";

export function ChartsPage() {
  const [tab, setTab] = React.useState(0);
  const [selectedId, setSelectedId] = useState<string>("");
  const [editMode, setEditMode] = useState(false);

  // dialog state:
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editChart, setEditChart] = useState<Chart | undefined>(undefined);
  const [editorMageChanges, setEditorMadeChanges] = useState<boolean>(false);
  const [saving, setSaving] = useState(false);

  const chartEditorRef = React.useRef<ChartEditorHandle>(null);

  const readonly = false;

  useEffect(() => {
    setSelectedId("");
  }, [tab]);

  // Find the chart object for the currently selected ID (or undefined)
  //const selectedChart: Chart | undefined = getChart(selectedId);
  const {
    data: selectedChart,
    isLoading: isSelectedChartLoading,
    error: selectedChartError,
  } = useChartById(selectedId ?? "");

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

  const handleDialogClose = () => {
    if (editorMageChanges) {
      const leave = window.confirm(
        "You have unsaved changes. Are you sure you want to close without saving?"
      );
      if (!leave) {
        return;
      }
    }
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
      const saved = await chartEditorRef.current.onSave();
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
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      {/* Top tabs */}
      <NavBar value={tab} onChange={setTab} />

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
            {selectedChart ? (
              <ChartEditor
                key={selectedChart.id}
                chart={selectedChart}
                setChart={setEditChart}
                editMode={false}
                setMadeChanges={setEditorMadeChanges}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                Select a chart to preview
              </div>
            )}
          </Box>
        ) : (
          <Box sx={{ flex: 1, minWidth: 0, minHeight: 0, display: "flex" }}>
            <AssetTab />
          </Box>
        )}
      </Box>
      <Dialog fullScreen open={dialogOpen} onClose={() => setDialogOpen(false)}>
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
              {!readonly ? (
                <FormControlLabel
                  style={{ background: "#7676c4" }}
                  control={
                    <Switch
                      checked={editMode}
                      onChange={(e) => setEditMode(e.target.checked)}
                      color="primary"
                    />
                  }
                  label={editMode ? "Edit Mode" : "View Mode"}
                />
              ) : null}
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
            editMode={editMode}
            setMadeChanges={setEditorMadeChanges}
            ref = {chartEditorRef}
          />
        )}
      </Dialog>
    </Box>
  );
}
