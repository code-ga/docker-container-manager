import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Server, RefreshCw, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';
import toast from 'react-hot-toast';

interface Node {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'maintenance';
  load: number;
  description?: string;
}

export interface ManualMigrateProps {
  containerId: string;
  currentNode?: string;
  onMigrate: (targetNodeId: string) => void;
  onCancel: () => void;
  className?: string;
}

export const ManualMigrate = ({
  currentNode,
  onMigrate,
  onCancel,
  className
}: ManualMigrateProps) => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingNodes, setIsLoadingNodes] = useState(true);

  // Mock data - in real implementation, this would come from API
  useEffect(() => {
    const fetchNodes = async () => {
      setIsLoadingNodes(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        const mockNodes: Node[] = [
          {
            id: 'node-1',
            name: 'node-01',
            status: 'online',
            load: 45,
            description: 'Primary production node'
          },
          {
            id: 'node-2',
            name: 'node-02',
            status: 'online',
            load: 23,
            description: 'Secondary production node'
          },
          {
            id: 'node-3',
            name: 'node-03',
            status: 'online',
            load: 67,
            description: 'High-performance node'
          },
          {
            id: 'node-4',
            name: 'node-04',
            status: 'maintenance',
            load: 0,
            description: 'Under maintenance'
          }
        ];

        setNodes(mockNodes);
      } catch {
        toast.error('Failed to load available nodes');
      } finally {
        setIsLoadingNodes(false);
      }
    };

    fetchNodes();
  }, []);

  const handleMigrate = async () => {
    if (!selectedNodeId) {
      toast.error('Please select a target node');
      return;
    }

    if (selectedNodeId === currentNode) {
      toast.error('Cannot migrate to the same node');
      return;
    }

    setIsLoading(true);
    try {
      await onMigrate(selectedNodeId);
    } catch {
      toast.error('Migration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const getNodeStatusColor = (status: Node['status']) => {
    switch (status) {
      case 'online':
        return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'offline':
        return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'maintenance':
        return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      default:
        return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
    }
  };

  const getNodeStatusLabel = (status: Node['status']) => {
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

  const availableNodes = nodes.filter(node => node.status === 'online' && node.id !== currentNode);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Current Node Info */}
      {currentNode && (
        <motion.div
          className="p-4 border border-gray-200 rounded-lg bg-gray-50 dark:bg-gray-800/50 dark:border-gray-700"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Server className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Current Node
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Container is currently running on <strong>{currentNode}</strong>
          </p>
        </motion.div>
      )}

      {/* Warning */}
      <motion.div
        className="p-4 border border-yellow-200 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              Migration Warning
            </h4>
            <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
              Manual migration will temporarily stop the container and restart it on the target node.
              This may cause a brief service interruption. Make sure to inform users if this is a production container.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Node Selection */}
      <div className="space-y-3">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Select Target Node
        </h3>

        {isLoadingNodes ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-neon-blue" />
            <span className="ml-2 text-gray-600 dark:text-gray-400">
              Loading available nodes...
            </span>
          </div>
        ) : availableNodes.length === 0 ? (
          <div className="py-8 text-center">
            <Server className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="text-gray-600 dark:text-gray-400">
              No available nodes for migration
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {availableNodes.map((node) => (
              <motion.div
                key={node.id}
                className={cn(
                  'p-4 rounded-lg border cursor-pointer transition-all duration-200',
                  selectedNodeId === node.id
                    ? 'border-neon-blue bg-neon-blue/10 shadow-neon'
                    : 'border-gray-200 dark:border-gray-600 hover:border-neon-blue/50'
                )}
                onClick={() => setSelectedNodeId(node.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {node.name}
                    </span>
                  </div>
                  <span className={cn(
                    'px-2 py-1 text-xs rounded-full border',
                    getNodeStatusColor(node.status)
                  )}>
                    {getNodeStatusLabel(node.status)}
                  </span>
                </div>

                {node.description && (
                  <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">
                    {node.description}
                  </p>
                )}

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Load:</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 overflow-hidden bg-gray-200 rounded-full dark:bg-gray-700">
                      <motion.div
                        className="h-full bg-gradient-to-r from-neon-blue to-neon-purple"
                        initial={{ width: 0 }}
                        animate={{ width: `${node.load}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {node.load}%
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button
          variant="secondary"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleMigrate}
          disabled={!selectedNodeId || isLoading}
          isLoading={isLoading}
          leftIcon={<RefreshCw className="w-4 h-4" />}
        >
          {isLoading ? 'Migrating...' : 'Start Migration'}
        </Button>
      </div>
    </div>
  );
};