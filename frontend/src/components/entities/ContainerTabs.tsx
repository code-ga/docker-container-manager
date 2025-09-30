import { motion } from 'framer-motion';
import { LogsTab } from './LogsTab';
import { ActionsTab } from './ActionsTab';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'error' | 'warn' | 'debug';
  message: string;
}

export interface Container {
  id: string;
  name: string;
  status: 'running' | 'stopped' | 'starting' | 'stopping' | 'error';
  type: 'standard' | 'ha';
  migrationStatus?: 'idle' | 'migrating' | 'failed';
  currentNode?: string;
  preferredClusterId?: string;
  cpuLimit?: number;
  memoryLimit?: number;
  diskLimit?: number;
  ports: Record<string, number>;
  environment: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

interface ContainerTabsProps {
  container: Container;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const ContainerTabs = ({
  container,
  activeTab,
  onTabChange
}: ContainerTabsProps) => {
  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'logs', label: 'Logs', icon: '📋' },
    { id: 'stats', label: 'Stats', icon: '📈' },
    { id: 'actions', label: 'Actions', icon: '⚙️' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'logs':
        return (
          <LogsTab
            containerId={container.id}
            containerStatus={container.status}
          />
        );
      case 'actions':
        return (
          <ActionsTab
            container={container}
          />
        );
      default:
        return (
          <LogsTab
            containerId={container.id}
            containerStatus={container.status}
          />
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-700">
        <nav className="flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors duration-200
                ${activeTab === tab.id
                  ? 'border-neon-blue text-neon-blue'
                  : 'border-transparent text-gray-400 hover:text-white hover:border-gray-300'
                }
              `}
            >
              <span className="text-base">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="min-h-[400px]"
      >
        {renderTabContent()}
      </motion.div>
    </div>
  );
};

export { ContainerTabs };