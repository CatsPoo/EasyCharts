import { Navigate, Route, Routes } from "react-router-dom";
import { ChartsPage } from "./pages/ChartsPage";
import { UsersPage } from "./pages/UsersPage";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { Permission } from "@easy-charts/easycharts-types";
import LoginPage from "./pages/LoginPage";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/charts" replace />} />
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute requiredPermission={Permission.CHART_READ}/>}>
      <Route path="/charts" element={ <ChartsPage />} />
      </Route>

      {/* Protected admin-only section */}
      <Route element={<ProtectedRoute requiredPermission={Permission.USER_MANAGE} />}>
        <Route path="/users" element={<UsersPage />} />
      </Route>

      {/* <Route path="*" element={<NotFound />} /> */}
    </Routes>
  );
}