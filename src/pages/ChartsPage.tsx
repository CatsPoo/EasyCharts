import * as React from 'react';
import Box from '@mui/material/Box';
import { NavBar } from '../components/NavBar';
import { ChartListSidebar } from '../components/ChartListSideBar';
import { ChartEditor } from '../components/ChartEditor';
import type { Chart } from '../types/topology/Chart';

export function ChartsPage() {
  const [tab, setTab] = React.useState(0);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

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
  React.useEffect(() => {
    setSelectedId(null);
  }, [tab]);

  // Find the chart object for the currently selected ID (or undefined)
  const selectedChart = chartsList.find(c => c.id === selectedId);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Top tabs */}
      <NavBar value={tab} onChange={setTab} />

      <Box sx={{ display: 'flex', flex: 1 }}>
        {/* Sidebar of chart names */}
        <ChartListSidebar
          charts={chartsList}
          onSelect={setSelectedId}// if you want it wider
        />

        {/* Preview area */}
        <Box sx={{ flex: 1, position: 'relative' }}>
          {selectedChart ? (
            // render in read‑only mode
            <ChartEditor chart={selectedChart} readonly />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Select a chart to preview
            </div>
          )}
        </Box>
      </Box>
    </Box>
  );
}
