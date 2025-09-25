import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './auth/authProvider';
import { ThemeModeProvider } from './contexts/ThemeModeContext';
import { ReactFlowProvider } from 'reactflow';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});


createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeModeProvider>
          <ReactFlowProvider>
            <App />
          </ReactFlowProvider>
        </ThemeModeProvider>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>
);
