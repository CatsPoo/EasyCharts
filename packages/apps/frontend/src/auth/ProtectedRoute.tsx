// src/components/auth/ProtectedRoute.tsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./useAuth";
import type { Permission } from "@easy-charts/easycharts-types";

export function ProtectedRoute({ requiredPermission }: { requiredPermission: Permission }) {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (requiredPermission && !user?.permissions?.includes(requiredPermission)) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}
