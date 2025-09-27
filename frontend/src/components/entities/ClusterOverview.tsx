import { motion } from 'framer-motion';
import { Server, Activity, AlertTriangle } from 'lucide-react';
import { NodeStatus } from './NodeStatus';
import { cn } from '../../lib/utils';

export interface ClusterNode {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'maintenance';
}

export interface ClusterOverviewProps {
  name: string;
  description?: string;
  nodes: ClusterNode[];
  className?: string;
}

const ClusterOverview = ({ name, description, nodes, className }: ClusterOverviewProps) => {
  const onlineNodes = nodes.filter(node => node.status === 'online').length;
  const offlineNodes = nodes.filter(node => node.status === 'offline').length;
  const maintenanceNodes = nodes.filter(node => node.status === 'maintenance').length;

  const totalNodes = nodes.length;
  const onlinePercentage = totalNodes > 0 ? Math.round((onlineNodes / totalNodes) * 100) : 0;

  return (
    <motion.div
      className={cn(
        'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition-shadow duration-200',
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-neon-blue/10">
            <Server className="w-6 h-6 text-neon-blue" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {name}
            </h3>
            {description && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {description}
              </p>
            )}
          </div>
        </div>

        <div className="text-right">
          <div className="text-2xl font-bold text-neon-blue">
            {totalNodes}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Total Nodes
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-green-500" />
            <span className="text-sm text-gray-700 dark:text-gray-300">Online</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-green-600 dark:text-green-400">
              {onlineNodes}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              ({onlinePercentage}%)
            </span>
          </div>
        </div>

        {offlineNodes > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Offline</span>
            </div>
            <span className="text-sm font-medium text-red-600 dark:text-red-400">
              {offlineNodes}
            </span>
          </div>
        )}

        {maintenanceNodes > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Maintenance</span>
            </div>
            <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
              {maintenanceNodes}
            </span>
          </div>
        )}
      </div>

      <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap gap-2">
          {nodes.slice(0, 5).map((node) => (
            <div key={node.id} className="flex items-center gap-1">
              <NodeStatus status={node.status} showLabel={false} />
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {node.name}
              </span>
            </div>
          ))}
          {nodes.length > 5 && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              +{nodes.length - 5} more
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export { ClusterOverview };