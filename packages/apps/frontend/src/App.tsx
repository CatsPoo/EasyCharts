import { ReactFlowProvider } from "reactflow";
import { ThemeModeProvider } from "./contexts/ThemeModeContext";
import { ChartsPage } from "./pages/ChartsPage";

function App() {
  return (
    <ThemeModeProvider>
      <div className="w-screen h-screen">
        <ReactFlowProvider>
          <ChartsPage />
        </ReactFlowProvider>
      </div>
    </ThemeModeProvider>
  );
}

export default App;
