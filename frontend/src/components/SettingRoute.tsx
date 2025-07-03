import { Outlet } from "react-router-dom";
import DashboardLayout from "./layout/SettingLayout";

const SettingRoute = () => {
  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
};

export default SettingRoute;
