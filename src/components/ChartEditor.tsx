import 'reactflow/dist/style.css';import { DevicesSidebar } from './DevicesSideBar';
import ReactFlow, { addEdge, Background, Controls, reconnectEdge, useEdgesState, useNodesState, useReactFlow } from 'reactflow';
import { useCallback, useRef, useEffect } from 'react';
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

  const convertDeviceToNode = (device: Device) : Node =>{
    const node : Node  ={
        id: device.id,
        type: 'default',
        position: device.position,
        data: { label: device.name }
    }
    return node
  }

  const convertDevicesToNodes =(devices: Device[]) : Node[] =>{
    const nodes : Node[] = devices.map(device => 
      convertDeviceToNode(device))
    return nodes
  }

  const convertLineToEdge = (line:Line) : Edge =>{
    return {
      id: line.id,
      source: line.sourceDeviceId,
      target: line.targeDevicetId,
      label: line.label,
      type:  'step',
      animated: false,      // optional: makes the edge animate
      //style: { strokeDasharray: l.type === 'rj45' ? '5 5' : undefined },
    }
  }

  const convertLinesToEdges = (lines: Line[]): Edge[] => {
    return lines.map((l) => convertLineToEdge(l));
  }


   const [nodes, setNodes, onNodesChangeRF] = useNodesState(
    convertDevicesToNodes(chart.devices)
  );
  const [edges, setEdges, onEdgesChangeRF] = useEdgesState(
    convertLinesToEdges(chart.lines)
  );

  const markChangesMade = useCallback(() => {
    if (onEditorChanged) onEditorChanged(true);
}, [onEditorChanged]);

 useEffect(() => {
    setNodes(convertDevicesToNodes(chart.devices));
    setEdges(convertLinesToEdges(chart.lines));
    markChangesMade();
  }, [chart, setNodes, setEdges]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      markChangesMade();
      onNodesChangeRF(changes);
    },
    [markChangesMade, onNodesChangeRF]
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      markChangesMade();
      onEdgesChangeRF(changes);
    },
    [markChangesMade, onEdgesChangeRF]
  );

const onConnect = useCallback(
    (c: Connection) => {
      markChangesMade();
      setEdges((eds) => addEdge(c, eds));
    },
    [markChangesMade, setEdges]
  );
  // const onReconnect = useCallback(
  //   (oldE: Edge, conn: Connection) => {
  //     markChangesMade();
  //     setEdges((eds) => reconnectEdge(oldE, conn, eds));
  //   },
  //   [markChangesMade, setEdges]
  // );

  const onDragOver = useCallback(
    (e: React.DragEvent) => {
      if (!editMode) return;
      markChangesMade();
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    },
    [editMode, markChangesMade]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      if (!editMode || !reactFlowWrapper.current) return;
      markChangesMade();
      e.preventDefault();
      const type = e.dataTransfer.getData('application/reactflow');
      if (!type) return;
      const bounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = project({
        x: e.clientX - bounds.left,
        y: e.clientY - bounds.top,
      });
      setNodes((nds) => [
        ...nds,
        { id: `${type}-${Date.now()}`, type: 'default', position, data: { label: type } },
      ]);
    },
    [editMode, markChangesMade, project, setNodes]
  );
  const onEdgeUpdate = useCallback(
    (oldE: Edge, conn: Connection) => {
      markChangesMade();
      setEdges((eds) => reconnectEdge(oldE, conn, eds));
    },
    [markChangesMade, setEdges]
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
      <div ref={reactFlowWrapper} 
      onDragOver={onDragOver}
      onDrop={onDrop}
       className="flex-1">
        <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={editMode ? onNodesChange : undefined}
        onEdgesChange={editMode ? onEdgesChange : undefined}
        onConnect={editMode ? onConnect : undefined}
        onEdgeUpdate={editMode ? onEdgeUpdate : undefined}
        nodesDraggable={editMode}
        nodesConnectable={editMode}
        fitView
        style={{ width: '100%', height: '100%' }}
      >
        <Background />
        <Controls />
      </ReactFlow>
      </div>
    </div>
  );
}
