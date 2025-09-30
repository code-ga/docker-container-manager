import { motion } from 'framer-motion';
import { Shield, Activity, HardDrive, Cpu, Zap } from 'lucide-react';
import { ContainerCard } from './ContainerCard';
import { NodeStatus } from './NodeStatus';
import { MigrationStatus } from './MigrationStatus';
import { cn } from '../../lib/utils';

interface Container {
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

interface OverviewTabProps {
  container: Container;
  migrationStatus?: 'idle' | 'migrating' | 'failed';
  haConnected: boolean;
}

const OverviewTab = ({ container, migrationStatus, haConnected }: OverviewTabProps) => {
  const getStatusColor = (status: Container['status']) => {
    switch (status) {
      case 'running':
        return 'bg-green-500 shadow-green-500/50';
      case 'stopped':
        return 'bg-gray-500 shadow-gray-500/50';
      case 'starting':
        return 'bg-blue-500 shadow-blue-500/50';
      case 'stopping':
        return 'bg-yellow-500 shadow-yellow-500/50';
      case 'error':
        return 'bg-red-500 shadow-red-500/50';
      default:
        return 'bg-gray-500 shadow-gray-500/50';
    }
  };

  const getStatusLabel = (status: Container['status']) => {
    switch (status) {
      case 'running':
        return 'Running';
      case 'stopped':
        return 'Stopped';
      case 'starting':
        return 'Starting';
      case 'stopping':
        return 'Stopping';
      case 'error':
        return 'Error';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <motion.div
        className="grid grid-cols-1 gap-6 lg:grid-cols-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {/* Status Card */}
        <div className="p-6 bg-white border border-gray-200 shadow-xl dark:bg-gray-800 rounded-xl dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Status & Configuration
            </h2>
            <div className="flex items-center gap-2">
              <motion.div
                className={cn(
                  'w-3 h-3 rounded-full shadow-lg',
                  getStatusColor(container.status)
                )}
                animate={{
                  scale: [1, 1.05, 1],
                  opacity: [1, 0.8, 1]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {getStatusLabel(container.status)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Container Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Container Information
              </h3>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">ID:</span>
                  <span className="font-mono text-sm text-gray-900 dark:text-white">
                    {container.id}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Type:</span>
                  <div className="flex items-center gap-2">
                    {container.type === 'ha' && <Shield className="w-4 h-4 text-neon-blue" />}
                    <span className={cn(
                      'font-medium',
                      container.type === 'ha' ? 'text-neon-blue' : 'text-gray-900 dark:text-white'
                    )}>
                      {container.type === 'ha' ? 'High Availability' : 'Standard'}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Current Node:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {container.currentNode || 'Unknown'}
                    </span>
                    {container.currentNode && (
                      <NodeStatus
                        status={haConnected ? 'online' : 'offline'}
                        showLabel={false}
                      />
                    )}
                  </div>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Created:</span>
                  <span className="text-gray-900 dark:text-white">
                    {new Date(container.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* HA Status */}
            {container.type === 'ha' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  High Availability Status
                </h3>

                <div className="space-y-3">
                  <MigrationStatus
                    status={migrationStatus || container.migrationStatus || 'idle'}
                    className="mb-4"
                  />

                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Cluster:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {container.preferredClusterId || 'Default'}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Auto Migration:</span>
                    <span className="font-medium text-green-600 dark:text-green-400">
                      Enabled
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Resource Limits */}
        <div className="p-6 bg-white border border-gray-200 shadow-xl dark:bg-gray-800 rounded-xl dark:border-gray-700">
          <h2 className="mb-6 text-xl font-semibold text-gray-900 dark:text-white">
            Resource Limits
          </h2>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {container.cpuLimit && (
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-blue-500" />
                <div>
                  <div className="text-sm font-medium">{container.cpuLimit} CPU</div>
                  <div className="text-xs text-gray-500">Limit</div>
                </div>
              </div>
            )}
            {container.memoryLimit && (
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-green-500" />
                <div>
                  <div className="text-sm font-medium">{container.memoryLimit}MB</div>
                  <div className="text-xs text-gray-500">Memory</div>
                </div>
              </div>
            )}
            {container.diskLimit && (
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-purple-500" />
                <div>
                  <div className="text-sm font-medium">{container.diskLimit}MB</div>
                  <div className="text-xs text-gray-500">Disk</div>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              <div>
                <div className="text-sm font-medium">{Object.keys(container.ports).length}</div>
                <div className="text-xs text-gray-500">Ports</div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Container Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <ContainerCard
          container={container}
          showLogs={false}
          className="max-w-none"
        />
      </motion.div>
    </div>
  );
};

export { OverviewTab };