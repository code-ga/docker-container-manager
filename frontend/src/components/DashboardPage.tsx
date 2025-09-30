import DashboardLayout from './layout/DashboardLayout';
import { OverviewSection } from './OverviewSection';
import { RecentActivity } from './RecentActivity';

const DashboardPage = () => {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <OverviewSection />
        <RecentActivity />
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;
