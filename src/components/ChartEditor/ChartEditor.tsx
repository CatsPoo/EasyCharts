import 'reactflow/dist/style.css';import { DevicesSidebar } from '../DevicesSideBar/DevicesSideBar';
import ReactFlow, { Background, Controls } from 'reactflow';
export function ChartEditor() {
  
  return (
    <div className="flex w-screen h-screen">
      <DevicesSidebar />
      <main className="flex-1">
        <ReactFlow
          nodes={[]}
          edges={[]}
          fitView
        >
          <Background />
          <Controls />
        </ReactFlow>
      </main>
    </div>
  );
}
