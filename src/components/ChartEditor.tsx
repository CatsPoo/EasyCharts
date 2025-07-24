import 'reactflow/dist/style.css';import { DevicesSidebar } from './DevicesSideBar';
import ReactFlow, { applyEdgeChanges, applyNodeChanges, Background, Controls, useReactFlow } from 'reactflow';
import { useCallback, useRef, useState } from 'react';
import type {Edge,EdgeChange,Node, NodeChange} from 'reactflow';

export function ChartEditor() {
  
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
      <DevicesSidebar />
      <div ref={reactFlowWrapper} className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onDragOver={onDragOver}
          onDrop={onDrop}
          fitView
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
}
