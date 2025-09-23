// src/App.tsx
import React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LoginPage } from "./pages/LoginPage";
import { ChartsPage } from "./pages/ChartsPage";
import { ReactFlowProvider } from "reactflow";
import { ThemeModeProvider } from "./contexts/ThemeModeContext";

const ProtectedShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Keep your existing providers for the main app pages
  return (
    <div className="w-screen h-screen">
      <ReactFlowProvider>{children}</ReactFlowProvider>
    </div>
  );
};

const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        index: true,
        element: (
          <ProtectedShell>
            <ChartsPage />
          </ProtectedShell>
        ),
      },
      // Add more protected routes here if you add more pages later
    ],
  },
]);

export const App: React.FC = () => <RouterProvider router={router} />;

export default App;
