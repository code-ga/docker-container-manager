import { CircleUser, PlusCircle } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useSession } from "../../lib/auth";
import LoadingPage from "../LoadingPage";
import "./Navbar.css";

const Navbar = () => {
  const location = useLocation();
  const { data, isPending } = useSession();
  if (isPending) {
    return <LoadingPage></LoadingPage>;
  }
  const isLoginPage = location.pathname === "/login";

  return (
    <nav className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white shadow-lg animate-navbar-fade">
      <div className="flex items-center">
        <img
          src="/vite.svg"
          alt="Vite Logo"
          className="h-10 w-10 drop-shadow-anime animate-logo-bounce"
        />
        <span className="ml-2 text-2xl font-extrabold tracking-widest font-anime">
          Lormas
        </span>
      </div>
      {isLoginPage ? null : (
        <div className="flex items-center space-x-3">
          <button
            className="bg-white bg-opacity-20 hover:bg-opacity-40 text-pink-200 hover:text-white rounded-full p-2 shadow-anime transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-pink-300 animate-pop"
            title="Create Container"
            onClick={() => alert("Create Container!")}
          >
            <PlusCircle className="h-7 w-7" />
          </button>
          <div className="relative group">
            <CircleUser className="h-10 w-10 cursor-pointer hover:scale-110 transition-transform duration-200" />
            <div className="absolute right-0 mt-2 w-32 bg-white bg-opacity-90 text-gray-800 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 p-2 text-sm font-semibold">
              {data?.user?.name || "User"}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
