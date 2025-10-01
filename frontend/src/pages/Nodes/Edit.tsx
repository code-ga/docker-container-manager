import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Server, Save, Database, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { FormBuilder, type FormField } from '../../components/data/FormBuilder';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useClusters } from '../../hooks/useClusters';
import { useNode, useUpdateNode, type UpdateNodeData } from '../../hooks/useNodes';
import { usePermissions } from '../../hooks/usePermissions';
import type { Node } from '../../hooks/useEntities';
import toast from 'react-hot-toast';

const EditNode = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Check permissions
  const { hasPermission } = usePermissions();
  const canUpdate = hasPermission('nodes:update');

  // Fetch node data
  const { data: nodeData, isLoading: isLoadingNode } = useNode(id || '');
  const node = nodeData as Node | undefined;

  // Fetch clusters for dropdown
  const { data: clustersData } = useClusters();
  const clusters = clustersData?.clusters || [];

  // Update node mutation
  const updateNodeMutation = useUpdateNode();

  const handleSubmit = async (data: Record<string, unknown>) => {
    if (!canUpdate || !id) {
      toast.error('You do not have permission to update nodes');
      return;
    }

    try {
      const nodeData: UpdateNodeData = {
        name: data.name as string,
        description: data.description as string,
        clusterId: data.clusterId as string,
      };

      await updateNodeMutation.mutateAsync({ id, data: nodeData });
      navigate(`/nodes/${id}`);
    } catch (error) {
      // Error handling is done in the mutation
      console.error('Error updating node:', error);
    }
  };

  const fields: FormField[] = [
    {
      name: 'name',
      label: 'Node Name',
      type: 'text',
      required: true,
      placeholder: 'my-awesome-node'
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      required: false,
      placeholder: 'Optional description for this node'
    },
    {
      name: 'clusterId',
      label: 'Cluster Assignment',
      type: 'select',
      required: false,
      placeholder: 'Select a cluster (optional)',
      options: clusters.map(cluster => cluster.name)
    }
  ];

  if (isLoadingNode) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-neon-blue" />
            <p className="text-gray-400">Loading node details...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!node) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Server className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h2 className="mb-2 text-xl font-semibold text-white">
              Node Not Found
            </h2>
            <p className="mb-4 text-gray-400">
              The requested node could not be found.
            </p>
            <Button onClick={() => navigate('/nodes')}>
              Back to Nodes
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

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
              You don't have permission to edit nodes.
            </p>
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
            onClick={() => navigate(`/nodes/${id}`)}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            className="mb-4"
          >
            Back to Node
          </Button>

          <div className="flex items-center gap-3 mb-2">
            <Server className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-white">
              Edit Node
            </h1>
          </div>
          <p className="text-gray-400">
            Update node configuration and settings
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
            <div className="p-6 border border-gray-700 rounded-lg bg-gray-800/50">
              <FormBuilder
                fields={fields}
                onSubmit={handleSubmit}
                initialData={{
                  name: node?.name || '',
                  description: node?.description || '',
                  clusterId: clusters.find((c) => c.id === node?.clusterId)?.name || ''
                }}
                submitLabel="Update Node"
                isLoading={updateNodeMutation.isPending}
                className="space-y-6"
              />

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-700">
                <Button
                  variant="secondary"
                  onClick={() => navigate(`/nodes/${id}`)}
                  disabled={updateNodeMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  isLoading={updateNodeMutation.isPending}
                  disabled={updateNodeMutation.isPending}
                  onClick={() => {
                    // Trigger form submission programmatically
                    const form = document.querySelector('form');
                    form?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                  }}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Update Node
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
            <div className="sticky p-6 border border-gray-700 rounded-lg bg-gray-800/50 top-6">
              <h3 className="mb-4 text-lg font-semibold text-white">
                Node Information
              </h3>

              <div className="space-y-4 text-sm">
                {/* Current Node Status */}
                <div className="p-3 rounded-lg bg-gray-700/50">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-3 h-3 rounded-full animate-pulse ${
                      node.status === 'online' ? 'bg-green-500' :
                      node.status === 'offline' ? 'bg-red-500' : 'bg-yellow-500'
                    }`} />
                    <span className="font-medium text-white">
                      {node.name}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    Status: <span className={`${
                      node.status === 'online' ? 'text-green-400' :
                      node.status === 'offline' ? 'text-red-400' : 'text-yellow-400'
                    }`}>
                      {node.status}
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    {node.containers?.length || 0} containers
                  </p>
                </div>

                {/* Node Stats */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-blue-500" />
                    <span className="text-gray-300">Resources:</span>
                  </div>

                  <div className="ml-6 space-y-1 text-xs text-gray-400">
                    <div>CPU: {node.resources?.cpu || 'Unknown'} cores</div>
                    <div>Memory: {node.resources?.memory || 'Unknown'}</div>
                    <div>Disk: {node.resources?.disk || 'Unknown'}</div>
                  </div>
                </div>

                {/* Timestamps */}
                <div className="pt-3 border-t border-gray-700">
                  <div className="space-y-1 text-xs text-gray-400">
                    <div>Created: {node.createdAt ? new Date(node.createdAt).toLocaleDateString() : 'Unknown'}</div>
                    <div>Updated: {node.updatedAt ? new Date(node.updatedAt).toLocaleDateString() : 'Unknown'}</div>
                  </div>
                </div>

                {/* Available Clusters */}
                {clusters.length > 0 && (
                  <div className="pt-3 border-t border-gray-700">
                    <h4 className="mb-2 text-sm font-medium text-white">
                      Available Clusters
                    </h4>
                    <div className="space-y-1">
                      {clusters.slice(0, 3).map((cluster, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs">
                          <div className="w-2 h-2 bg-blue-500 rounded-full" />
                          <span className="text-gray-300">
                            {cluster.name}
                          </span>
                        </div>
                      ))}
                      {clusters.length > 3 && (
                        <div className="text-xs text-gray-500">
                          +{clusters.length - 3} more clusters
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

export default EditNode;