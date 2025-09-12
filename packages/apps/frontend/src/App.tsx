import { ReactFlowProvider } from "reactflow";
import { ChartsPage } from "./pages/ChartsPage";
import { useColorScheme } from "./hooks/useColorSchema";
import { ThemeProvider, CssBaseline } from "@mui/material";

function App() {
  const { theme } = useColorScheme();
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="w-screen h-screen">
        <ReactFlowProvider>
          <ChartsPage />
        </ReactFlowProvider>
      </div>
    </ThemeProvider>
  );
}

export default App;
