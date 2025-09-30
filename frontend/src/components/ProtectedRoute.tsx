import { useSession } from "../lib/auth";
import { Outlet, useNavigate } from "react-router-dom";
import { usePermissions } from "../hooks/usePermissions";

interface ProtectedRouteProps {
  permissions?: string[];
  requireAll?: boolean;
  children?: React.ReactNode;
}

const ProtectedRoute = ({ permissions = [], requireAll = false }: ProtectedRouteProps) => {
  const { data, isPending } = useSession();
  const navigate = useNavigate();
  const { hasAnyPermission, hasAllPermissions, isLoading: permissionsLoading } = usePermissions();

  if (isPending || permissionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="w-16 h-16 border-4 border-purple-600 border-dashed rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!data?.session) {
    navigate("/login");
    return null;
  }

  // Check permissions if provided
  if (permissions.length > 0) {
    const hasRequiredPermissions = requireAll
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);

    if (!hasRequiredPermissions) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900">
          <div className="text-center">
            <h1 className="mb-4 text-4xl font-bold text-red-500">Access Denied</h1>
            <p className="mb-8 text-gray-400">You don't have permission to access this page</p>
            <button
              onClick={() => navigate("/dashboard")}
              className="px-6 py-3 font-semibold text-gray-900 transition-colors rounded-lg bg-neon-blue hover:bg-opacity-80"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      );
    }
  }

  return <Outlet />;
};

export default ProtectedRoute;
