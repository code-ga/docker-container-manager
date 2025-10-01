import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useNodes } from '../../hooks/useNodes';
import { useMigrateContainer } from '../../hooks/useContainers';
import { usePermissions } from '../../hooks/usePermissions';
import { toastManager } from '../../lib/toast';
import type { Node } from '../../hooks/useEntities';

export interface MigrationFormProps {
  containerId: string;
  containerName: string;
  currentNodeId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const MigrationForm: React.FC<MigrationFormProps> = ({
  containerId,
  containerName,
  currentNodeId,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string>('');
  const [scheduleMigration, setScheduleMigration] = useState(false);
  const { hasPermission } = usePermissions();

  const { data: nodesData, isLoading: isLoadingNodes } = useNodes();
  const nodes = nodesData?.nodes || [];

  const migrateMutation = useMigrateContainer();

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedNodeId('');
      setScheduleMigration(false);
    }
  }, [isOpen]);

  // Filter out current node from available nodes
  const availableNodes = nodes.filter(node => node.id !== currentNodeId && node.status === 'online');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedNodeId) {
      toastManager.showError('Please select a target node');
      return;
    }

    try {
      await migrateMutation.mutateAsync({
        id: containerId,
        data: {
          targetNodeId: selectedNodeId,
          schedule: scheduleMigration,
        },
      });

      const scheduleText = scheduleMigration ? 'scheduled for' : 'started';
      toastManager.showSuccess(`Container migration ${scheduleText} successfully`);
      onSuccess?.();
      onClose();
    } catch (error) {
      // Error toast is handled by the mutation
      console.error('Failed to migrate container:', error);
    }
  };

  const getNodeStatusColor = (status: Node['status']) => {
    switch (status) {
      case 'online':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200';
      case 'offline':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200';
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


  if (!hasPermission('migration:manage')) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Access Denied"
        description="You don't have permission to migrate containers."
      >
        <div className="text-center py-4">
          <p className="text-gray-500 dark:text-gray-400">
            Contact your administrator for migration permissions.
          </p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Migrate Container: ${containerName}`}
      description="Select a target node to migrate this container to."
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          {/* Target Node Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Target Node
            </label>
            {isLoadingNodes ? (
              <div className="flex items-center justify-center py-4">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span className="ml-2 text-sm text-gray-500">Loading nodes...</span>
              </div>
            ) : availableNodes.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {availableNodes.map((node) => (
                  <label
                    key={node.id}
                    className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 transition-colors"
                  >
                    <input
                      type="radio"
                      name="targetNode"
                      value={node.id}
                      checked={selectedNodeId === node.id}
                      onChange={(e) => {
                        setSelectedNodeId(e.target.value);
                      }}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <div className="ml-3 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {node.name}
                        </span>
                        <Badge className={getNodeStatusColor(node.status)}>
                          {getNodeStatusLabel(node.status)}
                        </Badge>
                      </div>
                      {node.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {node.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                        <span>{node.resources.cpu} CPU cores</span>
                        <span>{node.resources.memory} memory</span>
                        <span>{node.containers.length} containers</span>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500 dark:text-gray-400">
                  No available nodes for migration. All other nodes are either offline or in maintenance.
                </p>
              </div>
            )}
          </div>

          {/* Schedule Migration Option */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="scheduleMigration"
              checked={scheduleMigration}
              onChange={(e) => setScheduleMigration(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
            <label htmlFor="scheduleMigration" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Schedule migration for later (safer for production workloads)
            </label>
          </div>

          {/* Migration Warning */}
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Migration Warning
                </h3>
                <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                  <p>
                    Container migration will temporarily stop the container and may cause downtime.
                    {scheduleMigration ? ' Scheduled migrations run during maintenance windows.' : ' Immediate migrations happen now.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end pt-4 space-x-3 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={migrateMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={!selectedNodeId || migrateMutation.isPending}
            isLoading={migrateMutation.isPending}
          >
            {migrateMutation.isPending
              ? (scheduleMigration ? 'Scheduling...' : 'Migrating...')
              : (scheduleMigration ? 'Schedule Migration' : 'Migrate Now')
            }
          </Button>
        </div>
      </form>
    </Modal>
  );
};