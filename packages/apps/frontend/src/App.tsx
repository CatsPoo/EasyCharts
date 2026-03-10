import { BrowserRouter } from "react-router-dom";
import React, { type ReactNode } from "react";
import { AiChat } from "./components/AiChat/AiChat";
import { AiChatProvider } from "./contexts/AiChatContext";
import { useAiStatus } from "./hooks/aiChatHooks";
import { AppRoutes } from "./AppRoute";

/**
 * Fetches AI status once on mount.
 * Only mounts AiChatProvider and AiChat when the backend reports AI as enabled.
 * While loading (status unknown) or when disabled, renders children without any AI code.
 */
function AiFeatureGate({ children }: { children: ReactNode }) {
  const { data: statusData } = useAiStatus();

  if (!statusData?.enabled) return children as React.ReactElement;

  return (
    <AiChatProvider>
      {children}
      <AiChat />
    </AiChatProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AiFeatureGate>
        <AppRoutes />
      </AiFeatureGate>
    </BrowserRouter>
  );
}
