import { ReactFlowProvider } from "reactflow";
import { ChartsPage } from "./pages/ChartsPage";

function App() {
  return (
    <div className="w-screen h-screen">
      <ReactFlowProvider>
        <ChartsPage />
      </ReactFlowProvider>
    </div>
  );
}

export default App;
