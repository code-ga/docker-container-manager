import { Outlet } from "react-router-dom";
import DashboardLayout from "./layout/DashboardLayout";

const DashboardRoutes = () => {
  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
};

export default DashboardRoutes;
