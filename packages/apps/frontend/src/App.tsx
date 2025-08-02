import { ReactFlowProvider } from "reactflow";
import { ChartsPage } from "./pages/ChartsPage";
import { ChartsProvider } from "./contexts/ChartsContext";

function App() {
  return (
    <div className="w-screen h-screen">
      <ChartsProvider>
        <ReactFlowProvider>
          <ChartsPage/>
        </ReactFlowProvider>
      </ChartsProvider>

    </div>
  );
}

export default App;
