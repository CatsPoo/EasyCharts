import 'reactflow/dist/style.css';import { DevicesSidebar } from './DevicesSideBar';
import ReactFlow, { addEdge, applyEdgeChanges, applyNodeChanges, Background, Controls, reconnectEdge, useReactFlow } from 'reactflow';
import { useCallback, useRef, useState } from 'react';
import type {Connection, Edge,EdgeChange,Node, NodeChange} from 'reactflow';

export function ChartEditor() {
  const [editMode, setEditMode] = useState(true);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { project } = useReactFlow(); // requires you wrap App in <ReactFlowProvider>

  const [nodes, setNodes] = useState<Node[]>([
    {
      id: '1',
      type: 'default',
      position: { x: 100, y: 100 },
      data: { label: 'Core Router' },
    },
  ]);
  const [edges, setEdges] = useState<Edge[]>([]);

    const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    []
  );

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
    <div className="flex w-screen h-screen">
       {editMode && <DevicesSidebar />}
       <button
          className="absolute top-4 right-4 z-10 bg-white border rounded px-3 py-1 text-sm shadow"
          onClick={() => setEditMode((m) => !m)}
        >
          {editMode ? 'Exit Edit Mode' : 'Enter Edit Mode'}
        </button>
      <div ref={reactFlowWrapper} className="flex-1">
        <ReactFlow
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
