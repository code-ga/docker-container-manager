import { useSession } from "../lib/auth";
import { Outlet, useNavigate } from "react-router-dom";

const ProtectedRoute = () => {
  const { data, isPending } = useSession();
  const navigate = useNavigate();

  if (isPending) {
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

  return <Outlet />;
};

export default ProtectedRoute;
