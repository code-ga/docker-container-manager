import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import ContainersListPage from "../pages/Containers/List";
import CreateContainerPage from "../pages/Containers/CreateContainer";
import ContainerDetailPage from "../pages/Containers/DetailContainer";
import DashboardPage from "./DashboardPage";
import UsersPage from "../pages/Settings/UsersPage";
import NodesPage from "./DashboardPage"; // Placeholder for now
import ClustersPage from "./DashboardPage"; // Placeholder for now
import EggsPage from "./DashboardPage"; // Placeholder for now

const DashboardRoutes = () => {
  return (
    <Routes>
      {/* Dashboard Overview */}
      <Route index element={<DashboardPage />} />

      {/* Container Routes with Permissions */}
      <Route
        path="containers"
        element={
          <ProtectedRoute permissions={['containers:read']}>
            <ContainersListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="containers/create"
        element={
          <ProtectedRoute permissions={['containers:write']}>
            <CreateContainerPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="containers/:id"
        element={
          <ProtectedRoute permissions={['containers:read']}>
            <ContainerDetailPage />
          </ProtectedRoute>
        }
      />

      {/* Other Dashboard Routes */}
      <Route
        path="users"
        element={
          <ProtectedRoute permissions={['users:read']}>
            <UsersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="nodes"
        element={
          <ProtectedRoute permissions={['nodes:read']}>
            <NodesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="clusters"
        element={
          <ProtectedRoute permissions={['clusters:read']}>
            <ClustersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="eggs"
        element={
          <ProtectedRoute permissions={['eggs:read']}>
            <EggsPage />
          </ProtectedRoute>
        }
      />

      {/* Admin Route */}
      <Route
        path="admin"
        element={
          <ProtectedRoute permissions={['admin:access']}>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default DashboardRoutes;
