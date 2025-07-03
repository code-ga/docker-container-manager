import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
} from "react-router-dom";
import DashboardPage from "./components/DashboardPage";
import DashboardRoutes from "./components/DashboardRoutes";
import LoginPage from "./components/LoginPage";
import ProtectedRoute from "./components/ProtectedRoute";
import SettingRoute from "./components/SettingRoute";
import UserSettingsPage from "./components/UserSettingsPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardRoutes />}>
            <Route index element={<DashboardPage />} />
          </Route>
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route path="/setting" element={<SettingRoute />}>
            <Route path="user" element={<UserSettingsPage />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
