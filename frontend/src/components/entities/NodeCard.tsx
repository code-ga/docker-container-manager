import { useState } from 'react';
import { motion } from 'framer-motion';
import { Edit, Trash2, Link, Activity, HardDrive, Cpu, Wifi, WifiOff } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { usePermissions } from '../../hooks/usePermissions';
import { cn } from '../../lib/utils';
import type { Node } from '../../hooks/useEntities';

export interface NodeCardProps {
  node: Node;
  onEdit?: (node: Node) => void;
  onDelete?: (nodeId: string) => void;
  onAssign?: (nodeId: string) => void;
  className?: string;
  showActions?: boolean;
}

const NodeCard = ({
  node,
  onEdit,
  onDelete,
  onAssign,
  className,
  showActions = true
}: NodeCardProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { hasPermission } = usePermissions();

  const handleEdit = async () => {
    if (onEdit && hasPermission('node:manage')) {
      setIsLoading(true);
      try {
        await onEdit(node);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleDelete = async () => {
    if (onDelete && hasPermission('node:manage')) {
      setIsLoading(true);
      try {
        await onDelete(node.id);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleAssign = async () => {
    if (onAssign && hasPermission('node:manage')) {
      setIsLoading(true);
      try {
        await onAssign(node.id);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const getStatusColor = (status: Node['status']) => {
    switch (status) {
      case 'online':
        return 'bg-green-500 shadow-green-500/50';
      case 'offline':
        return 'bg-red-500 shadow-red-500/50';
      case 'maintenance':
        return 'bg-yellow-500 shadow-yellow-500/50';
      default:
        return 'bg-gray-500 shadow-gray-500/50';
    }
  };

  const getStatusLabel = (status: Node['status']) => {
    switch (status) {
      case 'online':
        return 'Online';
      case 'offline':
        return 'Offline';
      case 'maintenance':
        return 'Maintenance';
      default:
        return 'Unknown';
    }
  };

  const getStatusIcon = (status: Node['status']) => {
    switch (status) {
      case 'online':
        return <Wifi className="w-4 h-4" />;
      case 'offline':
        return <WifiOff className="w-4 h-4" />;
      case 'maintenance':
        return <Activity className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };


  // Mock usage data - in real implementation, this would come from API
  const cpuUsage = Math.floor(Math.random() * 100);
  const memoryUsage = Math.floor(Math.random() * 100);
  const diskUsage = Math.floor(Math.random() * 100);

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
          <motion.div
            className={cn(
              'w-3 h-3 rounded-full shadow-lg flex items-center justify-center',
              getStatusColor(node.status)
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
          >
            {getStatusIcon(node.status)}
          </motion.div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {node.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={
                node.status === 'online'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                  : node.status === 'offline'
                  ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200'
              }>
                {getStatusLabel(node.status)}
              </Badge>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {node.containers.length} containers
              </span>
            </div>
          </div>
        </div>

        {showActions && (
          <div className="flex gap-2">
            {hasPermission('node:manage') && (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleEdit}
                  leftIcon={<Edit className="w-4 h-4" />}
                  isLoading={isLoading}
                  disabled={isLoading}
                  aria-label={`Edit node ${node.name}`}
                >
                  Edit
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleAssign}
                  leftIcon={<Link className="w-4 h-4" />}
                  isLoading={isLoading}
                  disabled={isLoading}
                  aria-label={`Assign node ${node.name} to cluster`}
                >
                  Assign
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleDelete}
                  leftIcon={<Trash2 className="w-4 h-4" />}
                  isLoading={isLoading}
                  disabled={isLoading}
                  aria-label={`Delete node ${node.name}`}
                >
                  Delete
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {node.description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {node.description}
        </p>
      )}

      <div className="space-y-4">
        {/* Resource Usage Bars */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              CPU Usage
            </span>
            <span className="text-sm text-gray-500 ml-auto">
              {cpuUsage}% / {node.resources.cpu} cores
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <motion.div
              className="bg-blue-500 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(cpuUsage, 100)}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-green-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Memory Usage
            </span>
            <span className="text-sm text-gray-500 ml-auto">
              {memoryUsage}% / {node.resources.memory}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <motion.div
              className="bg-green-500 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(memoryUsage, 100)}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-purple-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Disk Usage
            </span>
            <span className="text-sm text-gray-500 ml-auto">
              {diskUsage}% / {node.resources.disk}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <motion.div
              className="bg-purple-500 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(diskUsage, 100)}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>
            Created: {new Date(node.createdAt).toLocaleDateString()}
          </span>
          <span>
            Updated: {new Date(node.updatedAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export { NodeCard };