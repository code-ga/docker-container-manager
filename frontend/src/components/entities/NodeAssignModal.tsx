import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useClusters } from '../../hooks/useClusters';
import { useAssignNodeToCluster } from '../../hooks/useNodes';
import { usePermissions } from '../../hooks/usePermissions';
import { toastManager } from '../../lib/toast';
import type { Cluster } from '../../hooks/useEntities';

export interface NodeAssignModalProps {
  nodeId: string;
  nodeName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const NodeAssignModal: React.FC<NodeAssignModalProps> = ({
  nodeId,
  nodeName,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [selectedClusterId, setSelectedClusterId] = useState<string>('');
  const { hasPermission } = usePermissions();

  const { data: clustersData, isLoading: isLoadingClusters } = useClusters();
  const clusters = clustersData?.clusters || [];

  const assignNodeMutation = useAssignNodeToCluster();

  // Reset selection when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedClusterId('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedClusterId) {
      toastManager.showError('Please select a cluster');
      return;
    }

    try {
      await assignNodeMutation.mutateAsync({
        id: nodeId,
        data: { clusterId: selectedClusterId },
      });

      toastManager.showSuccess(`Node "${nodeName}" assigned to cluster successfully`);
      onSuccess?.();
      onClose();
    } catch (error) {
      // Error toast is handled by the mutation
      console.error('Failed to assign node to cluster:', error);
    }
  };

  const getStatusColor = (status: Cluster['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200';
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200';
    }
  };

  const getStatusLabel = (status: Cluster['status']) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'inactive':
        return 'Inactive';
      case 'degraded':
        return 'Degraded';
      default:
        return 'Unknown';
    }
  };

  if (!hasPermission('node:manage')) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Access Denied"
        description="You don't have permission to assign nodes to clusters."
      >
        <div className="text-center py-4">
          <p className="text-gray-500 dark:text-gray-400">
            Contact your administrator for node management permissions.
          </p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Assign Node: ${nodeName}`}
      description="Select a cluster to assign this node to."
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Cluster
            </label>
            {isLoadingClusters ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span className="ml-2 text-sm text-gray-500">Loading clusters...</span>
              </div>
            ) : clusters.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {clusters.map((cluster) => (
                  <label
                    key={cluster.id}
                    className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 transition-colors"
                  >
                    <input
                      type="radio"
                      name="cluster"
                      value={cluster.id}
                      checked={selectedClusterId === cluster.id}
                      onChange={(e) => setSelectedClusterId(e.target.value)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <div className="ml-3 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {cluster.name}
                        </span>
                        <Badge className={getStatusColor(cluster.status)}>
                          {getStatusLabel(cluster.status)}
                        </Badge>
                      </div>
                      {cluster.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {cluster.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                        <span>{cluster.nodes?.length || 0} nodes</span>
                        <span>Created: {new Date(cluster.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">
                  No clusters available. Create a cluster first before assigning nodes.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end pt-4 space-x-3 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={assignNodeMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={!selectedClusterId || assignNodeMutation.isPending}
            isLoading={assignNodeMutation.isPending}
          >
            {assignNodeMutation.isPending ? 'Assigning...' : 'Assign Node'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};