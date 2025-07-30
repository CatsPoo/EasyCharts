import 'reactflow/dist/style.css';import { DevicesSidebar } from './DevicesSideBar';
import ReactFlow, { addEdge, applyEdgeChanges, applyNodeChanges, Background, Controls, reconnectEdge, useReactFlow } from 'reactflow';
import { useCallback, useRef, useState, useEffect } from 'react';
import type {Connection, Edge,EdgeChange,Node, NodeChange} from 'reactflow';
import { AnimatePresence,motion } from 'framer-motion';
import type { Chart } from '../types/topology/Chart';
import type { Device } from '../types/topology/Device';
import type { Line } from '../types/topology/Line';


interface ChardEditorProps  {
  chart : Chart
  editMode:boolean
  onEditorChanged : (editorMadeChanges: boolean) => void
}
export function ChartEditor({chart,editMode,onEditorChanged} : ChardEditorProps) {
  
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { project } = useReactFlow(); // requires you wrap App in <ReactFlowProvider>

  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    []
  );

  const convertDevicesToNodes =(devices: Device[]) : Node[] =>{
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

  const convertLinesToEdges = (lines: Line[]): Edge[] =>
    lines.map((l) => ({
      id: l.id,
      source: l.sourceDeviceId,
      target: l.targeDevicetId,
      label: l.label,
      type: /* you can choose a style, e.g. */ 'default',
      animated: false,      // optional: makes the edge animate
      //style: { strokeDasharray: l.type === 'rj45' ? '5 5' : undefined },
    }));

    useEffect(() => {
    setNodes(convertDevicesToNodes(chart.devices));
    setEdges(convertLinesToEdges(chart.lines));
    
  }, [chart]);


  const markChangesMade = useCallback(() => {
    if (onEditorChanged) onEditorChanged(true);
  }, [onEditorChanged]);

  const onReconnect = useCallback(
  (oldEdge: Edge, connection: Connection) =>{
    markChangesMade()
    setEdges((eds) => reconnectEdge(oldEdge, connection, eds))
  },
  [markChangesMade]
);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      markChangesMade()
      setNodes((nds) => applyNodeChanges(changes, nds));
  }, [markChangesMade]);
  
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      markChangesMade()
    setEdges((eds) => applyEdgeChanges(changes, eds));
  }, [markChangesMade]);

  const onDragOver = useCallback(
    (event: React.DragEvent) => {
      markChangesMade()
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
  }, [markChangesMade]);

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

      markChangesMade()
      setNodes((nds) => nds.concat(newNode));
    },
    [markChangesMade,project]
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
