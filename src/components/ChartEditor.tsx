import 'reactflow/dist/style.css';import { DevicesSidebar } from './DevicesSideBar';
import ReactFlow, { addEdge, applyEdgeChanges, applyNodeChanges, Background, Controls, reconnectEdge, useReactFlow } from 'reactflow';
import { useCallback, useRef, useState, useEffect } from 'react';
import type {Connection, Edge,EdgeChange,Node, NodeChange} from 'reactflow';
import { FormControlLabel, Switch } from '@mui/material';
import { AnimatePresence,motion } from 'framer-motion';
import type { Chart } from '../types/topology/Chart';
import type { Device } from '../types/topology/Device';


interface ChardEditorProps  {
  chart : Chart
  readonly : boolean
}
export function ChartEditor({chart,readonly} : ChardEditorProps) {
  const [editMode, setEditMode] = useState(! readonly);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { project } = useReactFlow(); // requires you wrap App in <ReactFlowProvider>

  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    []
  );

  function convertDevicesToNodes(devices: Device[]) : Node[]{
    const nodes : Node[] = devices.map(device =>{
      return {
        id: device.id,
        type: 'default',
        position: device.position,
        data: { label: device.name }
      } 
    })
    return nodes
  }

  // function convertLineToEdge(lines: Line[]) : Edge[]{
  //   const edges : Edge[] = lines.map(line =>{
  //     return {
  //       id:line.id,
  //     }
  //   })
  //   return edges
  // }

    useEffect(() => {
    setNodes(convertDevicesToNodes(chart.devices));
    setEdges([]);
    
  }, [chart]);

  const onReconnect = useCallback(
  (oldEdge: Edge, connection: Connection) =>
    setEdges((eds) => reconnectEdge(oldEdge, connection, eds)),
  []
);

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((nds) => applyNodeChanges(changes, nds));
  }, []);
  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdges((eds) => applyEdgeChanges(changes, eds));
  }, []);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      if (!reactFlowWrapper.current) return;

      const type = event.dataTransfer.getData('application/reactflow');
      if (!type) return;

      const bounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = project({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });

      const newNode: Node = {
        id: `${type}-${Date.now()}`,
        type: 'default',
        position,
        data: { label: `${type}` },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [project]
  );

  return (
    <div className="flex flex-1 h-full">
      <AnimatePresence initial={false}>
        {editMode && (
          <motion.div
            key="sidebar"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 192, opacity: 1 }}   // 192px = 12rem
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="flex-none overflow-hidden border-r bg-gray-100"
          >
            <DevicesSidebar />
          </motion.div>
        )}
      </AnimatePresence>

       <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 10, background: 'white', padding: 8, borderRadius: 4 }}>
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
      <div ref={reactFlowWrapper} className="flex-1">
        <ReactFlow
          style={{ width: '100%', height: '100%' }}
          key={chart.id}
          nodes={nodes}
          edges={edges}
          onNodesChange={editMode? onNodesChange: undefined}
          onEdgesChange={editMode ? onEdgesChange : undefined}
          onConnect={editMode ? onConnect : undefined}
          onEdgeUpdate={editMode ? onReconnect : undefined}
          onDragOver={editMode ?  onDragOver : undefined}
          onDrop={editMode ? onDrop : undefined}
          nodesDraggable={editMode}           // allow node drag
          nodesConnectable={editMode}         // allow new connections
          fitView
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
}
