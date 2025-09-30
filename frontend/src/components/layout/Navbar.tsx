import { CircleUser, PlusCircle, Container } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useSession, signOut } from "../../lib/auth";
import { usePermissions } from "../../hooks/usePermissions";
import LoadingPage from "../LoadingPage";
import "./Navbar.css";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { data, isPending } = useSession();
  const { hasPermission } = usePermissions();

  if (isPending) {
    return <LoadingPage></LoadingPage>;
  }
  const isLoginPage = location.pathname === "/login";
  const canManageContainers = hasPermission('containers:write');

  return (
    <nav className="flex items-center justify-between px-4 py-2.5 text-white shadow-lg bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 animate-navbar-fade">
      <Link to="/dashboard">
        <div className="flex items-center">
          <img
            src="/vite.svg"
            alt="Vite Logo"
            className="w-10 h-10 drop-shadow-anime animate-logo-bounce"
          />
          <span className="ml-2 text-2xl font-extrabold tracking-widest font-anime">
            Lormas
          </span>
        </div>
      </Link>
      {isLoginPage ? null : (
        <div className="flex items-center space-x-3">
          <motion.button
            className="p-2 font-bold text-pink-200 bg-transparent rounded-full bg-opacity-20 shadow-anime focus:outline-none focus:ring-2 focus:ring-white hover:text-white"
            title="Go to Admin Dashboard"
            onClick={() => navigate("/dashboard/admin")}
            whileHover={{ scale: 1.1, rotateY: 5 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            Admin Dashboard
          </motion.button>

          {/* Container Navigation */}
          <Link to="/dashboard/containers">
            <motion.button
              className="p-2 text-pink-200 bg-transparent rounded-full bg-opacity-20 shadow-anime focus:outline-none focus:ring-2 focus:ring-pink-300 hover:text-white"
              title="Containers"
              whileHover={{ scale: 1.1, rotateY: 5 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <Container className="h-7 w-7" />
            </motion.button>
          </Link>

          {canManageContainers && (
            <Link to="/dashboard/containers/create">
              <motion.button
                className="p-2 text-pink-200 bg-transparent rounded-full bg-opacity-20 shadow-anime focus:outline-none focus:ring-2 focus:ring-pink-300 hover:text-white"
                title="Create Container"
                whileHover={{ scale: 1.1, rotateY: 5 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <PlusCircle className="h-7 w-7" />
              </motion.button>
            </Link>
          )}
          <div className="relative group">
            <motion.div
              className="cursor-pointer"
              whileHover={{ scale: 1.1, rotateY: 5 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <CircleUser className="w-10 h-10" />
            </motion.div>
            <div className="absolute right-0 z-10 flex flex-col items-start w-40 p-2 mt-2 text-sm font-semibold text-gray-800 transition-opacity duration-300 bg-white rounded-lg shadow-lg opacity-0 bg-opacity-90 group-hover:opacity-100">
              <span className="mb-2">{data?.user?.name || "User"}</span>
              <button
                className="w-full px-2 py-1 font-bold text-left text-pink-600 transition-colors duration-200 bg-pink-100 rounded hover:bg-pink-200"
                onClick={() => navigate("/settings/user")}
              >
                Profile
              </button>
              <button
                className="w-full px-2 py-1 mt-1 font-bold text-left text-purple-600 transition-colors duration-200 bg-purple-100 rounded hover:bg-purple-200"
                onClick={() => navigate("/settings/users")}
              >
                Users
              </button>
              <button
                className="w-full px-2 py-1 mt-1 font-bold text-left text-indigo-600 transition-colors duration-200 bg-indigo-100 rounded hover:bg-indigo-200"
                onClick={() => navigate("/settings/roles")}
              >
                Roles
              </button>
              <button
                className="w-full px-2 py-1 mt-1 font-bold text-left text-red-600 transition-colors duration-200 bg-red-100 rounded hover:bg-red-200"
                onClick={() => signOut()}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
