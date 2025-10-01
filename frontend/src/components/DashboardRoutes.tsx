import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import ContainersListPage from "../pages/Containers/List";
import CreateContainerPage from "../pages/Containers/CreateContainer";
import ContainerDetailPage from "../pages/Containers/DetailContainer";
import DashboardPage from "./DashboardPage";
import UsersPage from "../pages/Settings/UsersPage";
import NodesListPage from "../pages/Nodes/List";
import NodesDetailPage from "../pages/Nodes/Detail";
import NodesCreatePage from "../pages/Nodes/Create";
import NodesEditPage from "../pages/Nodes/Edit";
import ClustersListPage from "../pages/Clusters/List";
import ClustersDetailPage from "../pages/Clusters/Detail";
import ClustersCreatePage from "../pages/Clusters/Create";
import ClustersEditPage from "../pages/Clusters/Edit";
import EggsListPage from "../pages/Eggs/List";
import EggsDetailPage from "../pages/Eggs/Detail";
import EggsCreatePage from "../pages/Eggs/Create";
import EggsEditPage from "../pages/Eggs/Edit";

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
            <NodesListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="nodes/create"
        element={
          <ProtectedRoute permissions={['nodes:create']}>
            <NodesCreatePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="nodes/:id"
        element={
          <ProtectedRoute permissions={['nodes:read']}>
            <NodesDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="nodes/:id/edit"
        element={
          <ProtectedRoute permissions={['nodes:update']}>
            <NodesEditPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="clusters"
        element={
          <ProtectedRoute permissions={['clusters:read']}>
            <ClustersListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="clusters/create"
        element={
          <ProtectedRoute permissions={['clusters:create']}>
            <ClustersCreatePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="clusters/:id"
        element={
          <ProtectedRoute permissions={['clusters:read']}>
            <ClustersDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="clusters/:id/edit"
        element={
          <ProtectedRoute permissions={['clusters:update']}>
            <ClustersEditPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="eggs"
        element={
          <ProtectedRoute permissions={['eggs:read']}>
            <EggsListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="eggs/create"
        element={
          <ProtectedRoute permissions={['eggs:create']}>
            <EggsCreatePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="eggs/:id"
        element={
          <ProtectedRoute permissions={['eggs:read']}>
            <EggsDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="eggs/:id/edit"
        element={
          <ProtectedRoute permissions={['eggs:update']}>
            <EggsEditPage />
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
