import { ReactFlowProvider } from "reactflow";
import { ChartEditor } from "./components/ChartEditor";

function App() {
  return (
    <div className="w-screen h-screen">
      <ReactFlowProvider>
        <ChartEditor/>
      </ReactFlowProvider>
    </div>
  );
}

export default App;
