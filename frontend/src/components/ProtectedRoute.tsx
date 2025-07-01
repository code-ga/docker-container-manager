import { useSession } from "@/lib/auth";
import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = () => {
  const { data, isPending } = useSession();

  if (isPending) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-purple-600"></div>
      </div>
    );
  }

  if (!data?.session) {
    return <Navigate to="/login" />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
