import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Server,
  Loader2,
  RefreshCw,
  Settings,
  Database,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Plus,
  Minus
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ClusterOverview } from '../../components/entities/ClusterOverview';
import { NodeCard } from '../../components/entities/NodeCard';
import { ContainerCard } from '../../components/entities/ContainerCard';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useCluster } from '../../hooks/useClusters';
import { useNodes } from '../../hooks/useNodes';
import { useContainers } from '../../hooks/useContainers';
import { usePermissions } from '../../hooks/usePermissions';
import { useWebSocket } from '../../hooks/useWebSocket';
import { cn } from '../../lib/utils';
import toast from 'react-hot-toast';
import type { Cluster, Node } from '../../hooks/useEntities';

const ClusterDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddNodesModal, setShowAddNodesModal] = useState(false);
  const [showRemoveNodesModal, setShowRemoveNodesModal] = useState(false);
  const [clusterStatus, setClusterStatus] = useState<string>('');

  const { hasPermission } = usePermissions();

  // Fetch cluster data
  const { data: clusterData, isLoading, error, refetch } = useCluster(id || '');
  const cluster = clusterData as Cluster;

  // Fetch all nodes for node management
  const { data: nodesData } = useNodes();
  const allNodes = (nodesData as { nodes: Node[] })?.nodes || [];

  // Fetch all containers and filter by cluster nodes
  const { data: allContainersData } = useContainers();
  const allContainers = (allContainersData as any[]) || [];

  // Filter containers by cluster nodes
  const containers = allContainers.filter((container) =>
    cluster.nodes?.includes(container.nodeId)
  );

  // WebSocket subscription for real-time cluster updates
  const { isConnected: wsConnected } = useWebSocket();

  // Update cluster status when WebSocket receives updates
  useEffect(() => {
    if (cluster) {
      setClusterStatus(cluster.status);
    }
  }, [cluster]);

  const handleRefresh = async () => {
    try {
      await refetch();
      toast.success('Cluster data refreshed');
    } catch {
      toast.error('Failed to refresh cluster data');
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-neon-blue" />
            <p className="text-gray-400">Loading cluster details...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !cluster) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-400" />
            <h2 className="mb-2 text-xl font-semibold text-white">
              Cluster Not Found
            </h2>
            <p className="text-gray-400 mb-4">
              {error?.message || 'The requested cluster could not be found.'}
            </p>
            <Button onClick={() => navigate('/clusters')}>
              Back to Clusters
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500 shadow-green-500/50';
      case 'degraded':
        return 'bg-yellow-500 shadow-yellow-500/50';
      case 'inactive':
        return 'bg-red-500 shadow-red-500/50';
      default:
        return 'bg-gray-500 shadow-gray-500/50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4" />;
      case 'degraded':
        return <AlertTriangle className="w-4 h-4" />;
      case 'inactive':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Server className="w-4 h-4" />;
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'nodes', label: 'Nodes', icon: '🖥️' },
    { id: 'containers', label: 'Containers', icon: '🐳' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ClusterOverview
              name={cluster.name}
              description={cluster.description}
              nodes={cluster.nodes?.map((nodeId: string) => {
                const node = allNodes.find((n) => n.id === nodeId);
                return node ? {
                  id: node.id,
                  name: node.name,
                  status: node.status
                } : null;
              }).filter((node): node is NonNullable<typeof node> => node !== null) || []}
            />
          </motion.div>
        );

      case 'nodes':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {cluster.nodes?.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {cluster.nodes.map((nodeId: string) => {
                  const node = allNodes.find((n) => n.id === nodeId);
                  if (!node) return null;

                  return (
                    <NodeCard
                      key={node.id}
                      node={node}
                      showActions={false}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center">
                <Server className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="mb-2 text-lg font-medium text-white">No nodes assigned</h3>
                <p className="text-gray-500">
                  This cluster doesn't have any nodes assigned to it yet.
                </p>
              </div>
            )}
          </motion.div>
        );

      case 'containers':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {containers.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {containers.map((container) => (
                  <ContainerCard
                    key={container.id}
                    container={container}
                    showLogs={false}
                  />
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <Database className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="mb-2 text-lg font-medium text-white">No containers found</h3>
                <p className="text-gray-500">
                  No containers are running in this cluster.
                </p>
              </div>
            )}
          </motion.div>
        );

      case 'settings':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Cluster Settings Form - Inline Edit */}
            <div className="p-6 bg-white border border-gray-200 shadow-xl dark:bg-gray-800 rounded-xl dark:border-gray-700">
              <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Cluster Settings</h3>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Cluster Name
                  </label>
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                    <span className="text-gray-900 dark:text-white">{cluster.name}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </label>
                  <Badge className={getStatusColor(cluster.status)}>
                    {cluster.status}
                  </Badge>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                    <span className="text-gray-900 dark:text-white">
                      {cluster.description || 'No description provided'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate(`/clusters/${cluster.id}/edit`)}
                  leftIcon={<Settings className="w-4 h-4" />}
                >
                  Edit Cluster
                </Button>
              </div>
            </div>

            {/* Node Management */}
            <div className="p-6 bg-white border border-gray-200 shadow-xl dark:bg-gray-800 rounded-xl dark:border-gray-700">
              <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Node Management</h3>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {hasPermission('clusters:update') && (
                  <>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setShowAddNodesModal(true)}
                      leftIcon={<Plus className="w-4 h-4" />}
                      className="w-full"
                    >
                      Add Nodes
                    </Button>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setShowRemoveNodesModal(true)}
                      leftIcon={<Minus className="w-4 h-4" />}
                      className="w-full"
                      disabled={cluster.nodes?.length === 0}
                    >
                      Remove Nodes
                    </Button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/clusters')}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            className="mb-4"
          >
            Back to Clusters
          </Button>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <motion.div
                  className={cn(
                    'w-3 h-3 rounded-full shadow-lg flex items-center justify-center',
                    getStatusColor(clusterStatus || cluster.status)
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
                  {getStatusIcon(clusterStatus || cluster.status)}
                </motion.div>
                {wsConnected && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">{cluster.name}</h1>
                <p className="text-gray-400">Cluster Details</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-400">WebSocket:</span>
                {wsConnected ? (
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200">
                    Connected
                  </Badge>
                ) : (
                  <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200">
                    Disconnected
                  </Badge>
                )}
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleRefresh}
                leftIcon={<RefreshCw className="w-4 h-4" />}
              >
                Refresh
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Tabs Navigation */}
        <div className="border-b border-gray-700">
          <nav className="flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors duration-200',
                  activeTab === tab.id
                    ? 'border-neon-blue text-neon-blue'
                    : 'border-transparent text-gray-400 hover:text-white hover:border-gray-300'
                )}
              >
                <span className="text-base">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="min-h-[400px]"
        >
          {renderTabContent()}
        </motion.div>
      </div>

      {/* Add Nodes Modal would go here */}
      {showAddNodesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md p-6 bg-gray-800 rounded-lg">
            <h3 className="mb-4 text-lg font-semibold text-white">Add Nodes to Cluster</h3>
            <p className="mb-4 text-gray-400">Modal implementation would go here</p>
            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => setShowAddNodesModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => setShowAddNodesModal(false)}
              >
                Add Nodes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Nodes Modal would go here */}
      {showRemoveNodesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md p-6 bg-gray-800 rounded-lg">
            <h3 className="mb-4 text-lg font-semibold text-white">Remove Nodes from Cluster</h3>
            <p className="mb-4 text-gray-400">Modal implementation would go here</p>
            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => setShowRemoveNodesModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => setShowRemoveNodesModal(false)}
              >
                Remove Nodes
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default ClusterDetailPage;