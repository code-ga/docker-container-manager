import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Server, Database, Settings } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { FormBuilder, type FormField } from '../../components/data/FormBuilder';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useCluster, useUpdateCluster, useAddNodesToCluster } from '../../hooks/useClusters';
import { useNodes } from '../../hooks/useNodes';
import { usePermissions } from '../../hooks/usePermissions';
import toast from 'react-hot-toast';
import type { Cluster, Node } from '../../hooks/useEntities';

const EditCluster = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Check permissions
  const { hasPermission } = usePermissions();
  const canUpdate = hasPermission('clusters:update');

  // Fetch cluster data
  const { data: clusterData, isLoading: clusterLoading, error: clusterError } = useCluster(id || '');
  const cluster = clusterData as Cluster;

  // Fetch nodes for multi-select
  const { data: nodesData } = useNodes();
  const nodes = (nodesData as { nodes: Node[] })?.nodes || [];

  // Update cluster mutation
  const updateClusterMutation = useUpdateCluster();

  // Add nodes to cluster mutation
  const addNodesMutation = useAddNodesToCluster();

  const handleSubmit = async (data: Record<string, unknown>) => {
    if (!canUpdate || !id) {
      toast.error('You do not have permission to update clusters');
      return;
    }

    try {
      // Update cluster data
      const updateData = {
        name: data.name as string,
        description: data.description as string,
      };

      await updateClusterMutation.mutateAsync({ id, data: updateData });

      // If nodes are selected, update them
      if (data.nodeIds) {
        const nodeIds = Array.isArray(data.nodeIds) ? data.nodeIds : [data.nodeIds];
        if (nodeIds.length > 0) {
          await addNodesMutation.mutateAsync({
            id,
            data: { nodeIds: nodeIds as string[] }
          });
        }
      }

      navigate(`/clusters/${id}`);
    } catch (error) {
      // Error handling is done in the mutations
      console.error('Error updating cluster:', error);
    }
  };

  const fields: FormField[] = [
    {
      name: 'name',
      label: 'Cluster Name',
      type: 'text',
      required: true,
      placeholder: 'my-awesome-cluster'
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      required: false,
      placeholder: 'Optional description for this cluster'
    },
    {
      name: 'nodeIds',
      label: 'Assign Nodes',
      type: 'select',
      required: false,
      placeholder: 'Select nodes to assign to this cluster',
      options: nodes.map(node => node.name)
    }
  ];

  if (!canUpdate) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Server className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h2 className="mb-2 text-xl font-semibold text-white">
              Access Denied
            </h2>
            <p className="text-gray-400">
              You don't have permission to edit clusters.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (clusterLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-8 h-8 mx-auto mb-4 animate-spin text-neon-blue border-2 border-current border-t-transparent rounded-full" />
            <p className="text-gray-400">Loading cluster...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (clusterError || !cluster) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Server className="w-16 h-16 mx-auto mb-4 text-red-400" />
            <h2 className="mb-2 text-xl font-semibold text-white">
              Cluster Not Found
            </h2>
            <p className="text-gray-400 mb-4">
              {clusterError?.message || 'The requested cluster could not be found.'}
            </p>
            <Button onClick={() => navigate('/clusters')}>
              Back to Clusters
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate(`/clusters/${id}`)}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            className="mb-4"
          >
            Back to Cluster
          </Button>

          <div className="flex items-center gap-3 mb-2">
            <Server className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-white">
              Edit Cluster
            </h1>
          </div>
          <p className="text-gray-400">
            Update cluster information and node assignments
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main Form */}
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="p-6 bg-gray-800/50 border border-gray-700 rounded-lg">
              <FormBuilder
                fields={fields}
                onSubmit={handleSubmit}
                submitLabel="Update Cluster"
                isLoading={updateClusterMutation.isPending || addNodesMutation.isPending}
                className="space-y-6"
              />

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-700">
                <Button
                  variant="secondary"
                  onClick={() => navigate(`/clusters/${id}`)}
                  disabled={updateClusterMutation.isPending || addNodesMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  isLoading={updateClusterMutation.isPending || addNodesMutation.isPending}
                  disabled={updateClusterMutation.isPending || addNodesMutation.isPending}
                  onClick={() => {
                    // Trigger form submission programmatically
                    const form = document.querySelector('form');
                    form?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                  }}
                >
                  Update Cluster
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Preview Panel */}
          <motion.div
            className="lg:col-span-1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="sticky p-6 bg-gray-800/50 border border-gray-700 rounded-lg top-6">
              <h3 className="mb-4 text-lg font-semibold text-white">
                Cluster Information
              </h3>

              <div className="space-y-4 text-sm">
                {/* Current Cluster Status */}
                <div className="p-3 rounded-lg bg-gray-700/50">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-3 h-3 rounded-full ${
                      cluster.status === 'active' ? 'bg-green-500' :
                      cluster.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                    <span className="font-medium text-white">
                      {cluster.name}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    Status: <span className={`capitalize ${
                      cluster.status === 'active' ? 'text-green-400' :
                      cluster.status === 'degraded' ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {cluster.status}
                    </span>
                  </p>
                </div>

                {/* Current Nodes */}
                {cluster.nodes && cluster.nodes.length > 0 && (
                  <div className="pt-3 border-t border-gray-700">
                    <h4 className="mb-2 text-sm font-medium text-white">
                      Current Nodes ({cluster.nodes.length})
                    </h4>
                    <div className="space-y-1">
                      {cluster.nodes.slice(0, 3).map((nodeId, idx) => {
                        const node = nodes.find(n => n.id === nodeId);
                        return node ? (
                          <div key={idx} className="flex items-center gap-2 text-xs">
                            <div className={`w-2 h-2 rounded-full ${
                              node.status === 'online' ? 'bg-green-500' :
                              node.status === 'offline' ? 'bg-red-500' : 'bg-yellow-500'
                            }`} />
                            <span className="text-gray-300">
                              {node.name}
                            </span>
                          </div>
                        ) : null;
                      })}
                      {cluster.nodes.length > 3 && (
                        <div className="text-xs text-gray-500">
                          +{cluster.nodes.length - 3} more nodes
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Features */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-blue-500" />
                    <span className="text-gray-300">Node Management</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4 text-green-500" />
                    <span className="text-gray-300">Load Balancing</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-purple-500" />
                    <span className="text-gray-300">Resource Monitoring</span>
                  </div>
                </div>

                {/* Available Nodes */}
                {nodes.length > 0 && (
                  <div className="pt-3 border-t border-gray-700">
                    <h4 className="mb-2 text-sm font-medium text-white">
                      Available Nodes
                    </h4>
                    <div className="space-y-1">
                      {nodes.filter(node => !cluster.nodes?.includes(node.id)).slice(0, 3).map((node, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs">
                          <div className={`w-2 h-2 rounded-full ${
                            node.status === 'online' ? 'bg-green-500' :
                            node.status === 'offline' ? 'bg-red-500' : 'bg-yellow-500'
                          }`} />
                          <span className="text-gray-300">
                            {node.name}
                          </span>
                        </div>
                      ))}
                      {nodes.filter(node => !cluster.nodes?.includes(node.id)).length > 3 && (
                        <div className="text-xs text-gray-500">
                          +{nodes.filter(node => !cluster.nodes?.includes(node.id)).length - 3} more nodes
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EditCluster;