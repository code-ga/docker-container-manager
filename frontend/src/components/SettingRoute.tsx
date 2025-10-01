import { Routes, Route, Outlet } from "react-router-dom";
import DashboardLayout from "./layout/SettingLayout";
import AdminPage from "../pages/Settings/AdminPage";
import ProtectedRoute from "./ProtectedRoute";

const SettingRoute = () => {
  return (
    <DashboardLayout>
      <Routes>
        <Route path="admin" element={
          <ProtectedRoute permissions={['admin:full']}>
            <AdminPage />
          </ProtectedRoute>
        } />
        <Route path="*" element={<Outlet />} />
      </Routes>
    </DashboardLayout>
  );
};

export default SettingRoute;
