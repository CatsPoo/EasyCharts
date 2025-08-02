import * as React from 'react';
import Box from '@mui/material/Box';
import { NavBar } from '../components/NavBar';
import { ChartListSidebar } from '../components/ChartListSideBar';
import { ChartEditor } from '../components/ChartEditor';
import type { Chart } from '@easy-charts/easycharts-types'
import { useState, useEffect, useCallback } from 'react';
import { AppBar, Button, Dialog, FormControlLabel, IconButton, Switch, Toolbar } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import {useCharts } from '../contexts/ChartsContext';

export function ChartsPage() {
    const [tab, setTab] = React.useState(0);
    const [selectedId, setSelectedId] = useState<string>('-1');
    const [editMode, setEditMode] = useState(false);
    
    // dialog state:
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editChart, setEditChart] = useState<Chart | null>(null);
    const [editorMageChanges, setEditorMadeChanges] = useState<boolean>(false)
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const {getChart,getChartsInformation,updateChart} = useCharts()
    const readonly = false
  // Your hard‑coded (or later: fetched) data
 
  // Derive the list based on the active tab
    const chartsLists = getChartsInformation()
    const chartsList = tab === 0 ? chartsLists.myCharts : chartsLists.sharedCharts;

    // Whenever the tab changes, clear the selection
    useEffect(() => {
    setSelectedId('-1');
    }, [tab]);

  // Find the chart object for the currently selected ID (or undefined)
    const selectedChart: Chart | undefined = getChart(selectedId)


    const handleEdit = (chartId: string) => {
        const chart = getChart(chartId)
        if(chart){  
          setSelectedId(chartId);
          setEditChart(structuredClone(chart));
          setEditorMadeChanges(false)
          setDialogOpen(true);
        }
        //TODO Handle chart loading error
    };

    const handleDialogClose = ()=>{
        if(editorMageChanges){
            const leave = window.confirm(
                'You have unsaved changes. Are you sure you want to close without saving?'
                );
            if (!leave) {
                return;
             }
        }
        setDialogOpen(false)
        setSelectedId('-1')
        setEditMode(false)
        setEditorMadeChanges(false)
    }

    const onSave = useCallback(async () => {
    //if (!draft) return;
    setSaving(true); setError(null);
    try {
      // const saved = await saveChartToDB(draft); // your API
      // updateLiveChart(saved);                   // update global store AFTER save
      // setIsEditing(false);
      setEditorMadeChanges(false)
      if(editChart)
        updateChart(editChart.id,editChart)
    } catch (e: any) {
      setError(e?.message ?? "Failed to save chart");
    } finally {
      setSaving(false);
    }
  }, []);

  const handleDraftChange = useCallback((next: Chart) => {
    setEditChart(next);            // update draft only
    setEditorMadeChanges(true);    // enable Save button
  }, []);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Top tabs */}
      <NavBar value={tab} onChange={setTab} />

      <Box sx={{ display: 'flex', flex: 1 }}>
        {/* Sidebar of chart names */}
        <ChartListSidebar
          charts={chartsList}
          onSelect={setSelectedId}
          onEdit={handleEdit}
        />

        {/* Preview area */}
        <Box sx={{ flex: 1, position: 'relative' }}>
          {selectedChart ? (
            // render in read‑only mode
            <ChartEditor chart={selectedChart} editMode={false} onEditorChanged={setEditorMadeChanges}  />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Select a chart to preview
            </div>
          )}
        </Box>
      </Box>
      <Dialog
        fullScreen
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      >
        <AppBar position="relative">
          <Toolbar>
            <IconButton edge="start" color="inherit" onClick={() => handleDialogClose()} aria-label="close">
              <CloseIcon/>
            </IconButton>
            <div style={{ position: 'absolute', top: 14, right: 16, zIndex: 10, background: '#7676c4', padding: 6, borderRadius: 4, height: 41 }}>
            {! readonly ? <FormControlLabel
            control={
              <Switch
                checked={editMode}
                onChange={(e) => setEditMode(e.target.checked)}
                color="primary"
              /> 
            }
            
            label={editMode ? 'Edit Mode' : 'View Mode'}
          /> : null}
        </div>
        {editMode && (
        <>
          <Button color="success"  variant="contained"  onClick={onSave} disabled={saving || !editorMageChanges} >
            {saving ? "Saving…" : "Save"}
          </Button>
        </>
        )}
          </Toolbar>
        </AppBar>

        {editChart && (
          <ChartEditor  chart={editChart} editMode={editMode} onDraftchange = {handleDraftChange} />
        )}
      </Dialog>
    </Box>
  );
}
