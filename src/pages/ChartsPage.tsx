import * as React from 'react';
import Box from '@mui/material/Box';
import { NavBar } from '../components/NavBar';
import { ChartListSidebar } from '../components/ChartListSideBar';
import { ChartEditor } from '../components/ChartEditor';
import type { Chart } from '../types/topology/Chart';
import { useState, useEffect } from 'react';
import { AppBar, Dialog, FormControlLabel, IconButton, Switch, Toolbar } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

export function ChartsPage() {
    const [tab, setTab] = React.useState(0);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [editMode, setEditMode] = useState(false);
    
    // dialog state:
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editChart, setEditChart] = useState<Chart | null>(null);
    const [editorMageChanges, setEditorMadeChanges] = useState<boolean>(false)

    const readonly = false
  // Your hard‑coded (or later: fetched) data
 const myCharts: Chart[] = [
    {
      id: '1',
      name: 'Core Network',
      description:'test-chart-1',
      devices: [
        { id: '1', type: 'switch', position: { x: 0, y: 0 },name:'sw1'},
        { id: '2', type: 'router', position: { x: 200, y: 0 },name:'r2'}
      ],
      lines: [{ id: '1', label: '1Gbps', type:'rj45'}],
    },
    {
      id: '2',
      name: 'site Network',
      description:'test-chart-2',
      devices: [
        { id: '3', type: 'switch', position: { x: 300, y: 300 },name:'sw1'},
        { id: '4', type: 'router', position: { x: 200, y: 200 },name:'r2'}
      ],
      lines: [{ id: '2', label: '1Gbps', type:'rj45'}],
    },
  ];

  const sharedCharts: Chart[] =[
    {
      id: '3',
      name: 'Core Network',
      description:'test-chart-1',
      devices: [
        { id: '5', type: 'switch', position: { x: 0, y: 0 },name:'sw1'},
        { id: '6', type: 'router', position: { x: 200, y: 0 },name:'r2'}
      ],
      lines: [{ id: '3', label: '1Gbps', type:'rj45'}],
    },
  ];
  // Derive the list based on the active tab
    const chartsList = tab === 0 ? myCharts : sharedCharts;

    // Whenever the tab changes, clear the selection
    useEffect(() => {
    setSelectedId(null);
    }, [tab]);

  // Find the chart object for the currently selected ID (or undefined)
    const selectedChart = chartsList.find(c => c.id === selectedId);


    const handleEdit = (chart: Chart) => {
        setSelectedId(chart.id);
        setEditChart(chart);
        setEditorMadeChanges(false)
        setDialogOpen(true);
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
        setSelectedId(null)
        setEditMode(false)
        setEditorMadeChanges(false)
    }
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
          </Toolbar>
        </AppBar>

        {editChart && (
          <ChartEditor chart={editChart} editMode={editMode} onEditorChanged = {setEditorMadeChanges} />
        )}
      </Dialog>
    </Box>
  );
}
