import React from 'react';
import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
  Outlet,
} from "react-router-dom";
import { AuthProvider } from "./components/AuthProvider";
import { DarkThemeProvider } from "./components/providers/DarkThemeProvider";
import { AnimeWrapper } from "./components/providers/AnimeWrapper";
import DashboardLayout from "./components/layout/DashboardLayout";
import LoginPage from "./components/LoginPage";
import ProtectedRoute from "./components/ProtectedRoute";
import UserSettingsPage from "./components/UserSettingsPage";

// Placeholder components for routes that will be implemented later
const DashboardPage = () => <div className="text-white">Dashboard Overview</div>;
const UsersPage = () => <div className="text-white">Users Management</div>;
const RolesPage = () => <div className="text-white">Roles Management</div>;
const NodesPage = () => <div className="text-white">Nodes Management</div>;
const ClustersPage = () => <div className="text-white">Clusters Management</div>;
const EggsPage = () => <div className="text-white">Eggs Management</div>;
const ContainersPage = () => <div className="text-white">Containers Management</div>;

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen text-white bg-gray-900">
          <div className="text-center">
            <h1 className="mb-4 text-4xl font-bold">Something went wrong</h1>
            <p className="mb-8 text-gray-400">An unexpected error occurred</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 font-semibold text-gray-900 transition-colors rounded-lg bg-neon-blue hover:bg-opacity-80"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// 404 Not Found Component
const NotFound = () => (
  <div className="flex items-center justify-center min-h-screen text-white bg-gray-900">
    <div className="text-center">
      <h1 className="mb-4 font-bold text-8xl text-neon-blue">404</h1>
      <h2 className="mb-4 text-3xl font-semibold">Page Not Found</h2>
      <p className="mb-8 text-gray-400">The page you're looking for doesn't exist</p>
      <button
        onClick={() => window.history.back()}
        className="px-6 py-3 font-semibold text-white transition-colors rounded-lg bg-neon-purple hover:bg-opacity-80"
      >
        Go Back
      </button>
    </div>
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <DarkThemeProvider>
          <AnimeWrapper>
            <Router>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<div className="text-white">Register Page</div>} />

                {/* Protected Dashboard Routes */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/dashboard" element={
                    <DashboardLayout>
                      <Outlet />
                    </DashboardLayout>
                  }>
                    <Route index element={<DashboardPage />} />
                    <Route path="users" element={<UsersPage />} />
                    <Route path="roles" element={<RolesPage />} />
                    <Route path="nodes" element={<NodesPage />} />
                    <Route path="clusters" element={<ClustersPage />} />
                    <Route path="eggs" element={<EggsPage />} />
                    <Route path="containers" element={<ContainersPage />} />
                  </Route>
                </Route>

                {/* Protected Settings Routes */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/settings" element={
                    <DashboardLayout>
                      <Outlet />
                    </DashboardLayout>
                  }>
                    <Route path="user" element={<UserSettingsPage />} />
                  </Route>
                </Route>

                {/* 404 Route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Router>
          </AnimeWrapper>
        </DarkThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
