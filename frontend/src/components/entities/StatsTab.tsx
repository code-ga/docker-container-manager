import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Cpu, HardDrive, TrendingUp, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';
import StatsChart, { type ChartDataPoint } from './StatsChart';

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

interface StatsTabProps {
  container: Container;
}

interface StatsData extends ChartDataPoint {
  cpu: number;
  memory: number;
  disk: number;
}

const StatsTab = ({ container }: StatsTabProps) => {
  const [statsData, setStatsData] = useState<StatsData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h'>('1h');

  // Generate mock stats data for demonstration
  useEffect(() => {
    const generateMockStats = () => {
      const now = new Date();
      const data: StatsData[] = [];
      const points = timeRange === '1h' ? 12 : timeRange === '6h' ? 24 : 48;

      for (let i = points; i >= 0; i--) {
        const timestamp = new Date(now.getTime() - i * (timeRange === '1h' ? 5 : timeRange === '6h' ? 15 : 30) * 60 * 1000);
        data.push({
          timestamp: timestamp.toISOString(),
          cpu: container.cpuLimit ? Math.random() * (container.cpuLimit * 0.8) + (container.cpuLimit * 0.1) : Math.random() * 50 + 10,
          memory: container.memoryLimit ? Math.random() * (container.memoryLimit * 0.8) + (container.memoryLimit * 0.1) : Math.random() * 200 + 50,
          disk: container.diskLimit ? Math.random() * (container.diskLimit * 0.8) + (container.diskLimit * 0.1) : Math.random() * 500 + 100
        });
      }
      setStatsData(data);
    };

    generateMockStats();
    const interval = setInterval(generateMockStats, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, [container, timeRange]);

  const refreshStats = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
  };


  const getCurrentStats = () => {
    return statsData[statsData.length - 1] || { cpu: 0, memory: 0, disk: 0 };
  };

  const getUsagePercentage = (current: number, limit?: number) => {
    if (!limit) return 0;
    return Math.min((current / limit) * 100, 100);
  };

  const currentStats = getCurrentStats();

  return (
    <div className="space-y-6">
      {/* Controls */}
      <motion.div
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Time Range:</span>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as '1h' | '6h' | '24h')}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="1h">1 Hour</option>
              <option value="6h">6 Hours</option>
              <option value="24h">24 Hours</option>
            </select>
          </div>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={refreshStats}
          leftIcon={<RefreshCw className="w-4 h-4" />}
          isLoading={isLoading}
        >
          Refresh
        </Button>
      </motion.div>

      {/* Current Stats Cards */}
      <motion.div
        className="grid grid-cols-1 gap-4 md:grid-cols-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="p-4 bg-white border border-gray-200 shadow-lg dark:bg-gray-800 rounded-xl dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-blue-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">CPU Usage</span>
            </div>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {currentStats.cpu.toFixed(1)}%
            </div>
            {container.cpuLimit && (
              <div className="text-xs text-gray-500">
                of {container.cpuLimit} cores limit
              </div>
            )}
          </div>
          <div className="mt-3">
            <div className="w-full h-2 bg-gray-200 rounded-full dark:bg-gray-700">
              <div
                className="h-2 transition-all duration-300 bg-blue-500 rounded-full"
                style={{ width: `${getUsagePercentage(currentStats.cpu, container.cpuLimit)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="p-4 bg-white border border-gray-200 shadow-lg dark:bg-gray-800 rounded-xl dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Memory Usage</span>
            </div>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {currentStats.memory.toFixed(0)}MB
            </div>
            {container.memoryLimit && (
              <div className="text-xs text-gray-500">
                of {container.memoryLimit}MB limit
              </div>
            )}
          </div>
          <div className="mt-3">
            <div className="w-full h-2 bg-gray-200 rounded-full dark:bg-gray-700">
              <div
                className="h-2 transition-all duration-300 bg-green-500 rounded-full"
                style={{ width: `${getUsagePercentage(currentStats.memory, container.memoryLimit)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="p-4 bg-white border border-gray-200 shadow-lg dark:bg-gray-800 rounded-xl dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-purple-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Disk Usage</span>
            </div>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {currentStats.disk.toFixed(0)}MB
            </div>
            {container.diskLimit && (
              <div className="text-xs text-gray-500">
                of {container.diskLimit}MB limit
              </div>
            )}
          </div>
          <div className="mt-3">
            <div className="w-full h-2 bg-gray-200 rounded-full dark:bg-gray-700">
              <div
                className="h-2 transition-all duration-300 bg-purple-500 rounded-full"
                style={{ width: `${getUsagePercentage(currentStats.disk, container.diskLimit)}%` }}
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Charts */}
      <motion.div
        className="grid grid-cols-1 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {/* Combined Stats Chart */}
        <div className="p-6 bg-white border border-gray-200 shadow-xl dark:bg-gray-800 rounded-xl dark:border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-purple-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Resource Usage Over Time</h3>
          </div>
          <StatsChart
            data={statsData}
            height={300}
            chartType="line"
            metrics={[
              { key: 'cpu', label: 'CPU Usage', color: '#3b82f6', unit: '%' },
              { key: 'memory', label: 'Memory Usage', color: '#10b981', unit: 'MB' },
              { key: 'disk', label: 'Disk Usage', color: '#f59e0b', unit: 'MB' },
            ]}
            formatXAxisTick={(timestamp) =>
              new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          />
        </div>
      </motion.div>
    </div>
  );
};


export { StatsTab };