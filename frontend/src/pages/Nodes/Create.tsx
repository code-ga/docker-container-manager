import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Server, Database, Settings } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { FormBuilder, type FormField } from '../../components/data/FormBuilder';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useClusters } from '../../hooks/useClusters';
import { useCreateNode, type CreateNodeData } from '../../hooks/useNodes';
import { usePermissions } from '../../hooks/usePermissions';
import toast from 'react-hot-toast';

const CreateNode = () => {
  const navigate = useNavigate();

  // Check permissions
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission('nodes:create');

  // Fetch clusters for dropdown
  const { data: clustersData } = useClusters();
  const clusters = clustersData?.clusters || [];

  // Create node mutation
  const createNodeMutation = useCreateNode();

  const handleSubmit = async (data: Record<string, unknown>) => {
    if (!canCreate) {
      toast.error('You do not have permission to create nodes');
      return;
    }

    try {
      const nodeData: CreateNodeData = {
        name: data.name as string,
        description: data.description as string,
        clusterId: data.clusterId as string,
      };

      await createNodeMutation.mutateAsync(nodeData);
      navigate('/nodes');
    } catch (error) {
      // Error handling is done in the mutation
      console.error('Error creating node:', error);
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

  if (!canCreate) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Server className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h2 className="mb-2 text-xl font-semibold text-white">
              Access Denied
            </h2>
            <p className="text-gray-400">
              You don't have permission to create nodes.
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
            onClick={() => navigate('/nodes')}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            className="mb-4"
          >
            Back to Nodes
          </Button>

          <div className="flex items-center gap-3 mb-2">
            <Server className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-white">
              Create Node
            </h1>
          </div>
          <p className="text-gray-400">
            Add a new node to your infrastructure
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
                submitLabel="Create Node"
                isLoading={createNodeMutation.isPending}
                className="space-y-6"
              />

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-700">
                <Button
                  variant="secondary"
                  onClick={() => navigate('/nodes')}
                  disabled={createNodeMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  isLoading={createNodeMutation.isPending}
                  disabled={createNodeMutation.isPending}
                  onClick={() => {
                    // Trigger form submission programmatically
                    const form = document.querySelector('form');
                    form?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                  }}
                >
                  Create Node
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
                {/* Node Status Preview */}
                <div className="p-3 rounded-lg bg-gray-700/50">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                    <span className="font-medium text-white">
                      New Node
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    Status: <span className="text-green-400">Online</span>
                  </p>
                </div>

                {/* Features */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-blue-500" />
                    <span className="text-gray-300">Container Management</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4 text-green-500" />
                    <span className="text-gray-300">Real-time Monitoring</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-purple-500" />
                    <span className="text-gray-300">Resource Tracking</span>
                  </div>
                </div>

                {/* Cluster Assignment */}
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

                {/* Requirements */}
                <div className="pt-3 border-t border-gray-700">
                  <h4 className="mb-2 text-sm font-medium text-white">
                    Requirements
                  </h4>
                  <div className="space-y-1 text-xs text-gray-400">
                    <div>• Docker daemon running</div>
                    <div>• Network connectivity to server</div>
                    <div>• Sufficient system resources</div>
                    <div>• WebSocket support</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CreateNode;