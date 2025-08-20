import type { Chart, Device, DeviceOnChart, Line } from '@easy-charts/easycharts-types';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useRef } from 'react';
import type { Connection, Edge, EdgeChange, Node, NodeChange } from 'reactflow';
import ReactFlow, { addEdge, Background, ConnectionLineType, Controls, reconnectEdge, useEdgesState, useNodesState, useReactFlow } from 'reactflow';
import 'reactflow/dist/style.css';
import { DevicesSidebar } from "./DevicesSideBar";

interface ChardEditorProps  {
  chart : Chart
  editMode:boolean
  onDraftchange : (nextDraft: Chart) => void
}
export function ChartEditor({chart,editMode,onDraftchange} : ChardEditorProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { project } = useReactFlow(); // requires you wrap App in <ReactFlowProvider>

  const convertDeviceToNode = (deviceLocations: DeviceOnChart) : Node =>{
    const {device,position} = deviceLocations
    const node : Node  ={
        id: device.id,
        type: 'default',
        position,
        data: { label: device.name}
    }
    return node
  }

  const convertDevicesToNodes =(devicesLocations: DeviceOnChart[]) : Node[] =>{
    const nodes : Node[] = devicesLocations.map(deviceLocation => 
      convertDeviceToNode(deviceLocation))
    return nodes
  }

  const convertLineToEdge = (line:Line) : Edge =>{
    return {
      id: line.id,
      source: line.sourceDeviceId,
      target: line.targetDeviceId,
      label: line.label,
      type:  'step',
      animated: false,      // optional: makes the edge animate
      //style: { strokeDasharray: l.type === 'rj45' ? '5 5' : undefined },
    }
  }

  const convertNodeToDeviceLocation = (node:Node) :DeviceOnChart =>{

    const device : Device = {
      id: node.id,
      name: node.data.lable,
      type:'default'
    }
    return {
      device: device,
      position: node.position
    }
  }

  const convertLinesToEdges = (lines: Line[]): Edge[] => {
    return  (lines) ?lines.map((l) => convertLineToEdge(l)) :[];
  }


   const [nodes, setNodes, onNodesChangeRF] = useNodesState(
    convertDevicesToNodes(chart.devicesLocations)
  );
  const [edges, setEdges, onEdgesChangeRF] = useEdgesState(
    convertLinesToEdges(chart.lines)
  );

 useEffect(() => {
    setNodes(convertDevicesToNodes(chart.devicesLocations));
    setEdges(convertLinesToEdges(chart.lines));
  }, [setNodes, setEdges]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChangeRF(changes);
      const updatedDevicesLocations :DeviceOnChart[] = nodes.map(nds => convertNodeToDeviceLocation(nds))
      onDraftchange({...chart,devicesLocations:updatedDevicesLocations})
    },
    [onNodesChangeRF]
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      onEdgesChangeRF(changes);
    },
    [onEdgesChangeRF,setEdges]
  );

const onConnect = useCallback(
    (c: Connection) => {
      setEdges((eds) => addEdge(c, eds));
      onDraftchange({...chart});
    },
    [onDraftchange, setEdges]
  );

  const onDragOver = useCallback(
    (e: React.DragEvent) => {
      if (!editMode) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    },
    [editMode, onDraftchange]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      if (!editMode || !reactFlowWrapper.current) return;
      e.preventDefault();
      const type = e.dataTransfer.getData('application/reactflow');
      if (!type) return;
      const bounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = project({
        x: e.clientX - bounds.left,
        y: e.clientY - bounds.top,
      });
      const newNode = { id: `${type}-${Date.now()}`, type: 'default', position, data: { label: type } }
      setNodes((nds) => [
        ...nds,
        newNode
      ]);

      const newDeviceLocations : DeviceOnChart = convertNodeToDeviceLocation(newNode)
      onDraftchange({...chart,devicesLocations: [...chart.devicesLocations,newDeviceLocations]});
    },
    [editMode, onDraftchange, project, setNodes]
  );
  const onEdgeUpdate = useCallback(
    (oldE: Edge, conn: Connection) => {
      onDraftchange({...chart});
      setEdges((eds) => reconnectEdge(oldE, conn, eds));
    },
    [onDraftchange, setEdges]
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
        defaultEdgeOptions={{type:ConnectionLineType.Step}}
         connectionLineType={ConnectionLineType.Step}
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
