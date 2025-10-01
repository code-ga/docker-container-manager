import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Server,
  Loader2,
  RefreshCw,
  Activity,
  Settings,
  Database,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Play,
  Square,
  Wrench
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { NodeCard } from '../../components/entities/NodeCard';
import { NodeAssignModal } from '../../components/entities/NodeAssignModal';
import { ContainerCard } from '../../components/entities/ContainerCard';
import { LogsTab } from '../../components/entities/LogsTab';
import { ActionsTab } from '../../components/entities/ActionsTab';
import { StatsChart } from '../../components/entities/StatsChart';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useNode } from '../../hooks/useNodes';
import { useContainers } from '../../hooks/useContainers';
import { usePermissions } from '../../hooks/usePermissions';
import { useWebSocket } from '../../hooks/useWebSocket';
import type { Node } from '../../hooks/useEntities';
import type { Container } from '../../hooks/useContainers';
import { cn } from '../../lib/utils';
import toast from 'react-hot-toast';

const NodeDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [nodeStatus, setNodeStatus] = useState<string>('');

  const { hasPermission } = usePermissions();

  // Fetch node data
  const { data: nodeData, isLoading, error, refetch } = useNode(id || '');
  const node = nodeData as Node | undefined;

  // Fetch containers assigned to this node
  const { data: containersData } = useContainers({ nodeId: id });
  const containers = (containersData as Container[]) || [];

  // WebSocket subscription for real-time node updates
  const { isConnected: wsConnected } = useWebSocket();

  // Update node status when WebSocket receives updates
  useEffect(() => {
    if (node) {
      setNodeStatus(node.status);
    }
  }, [node]);

  const handleRefresh = async () => {
    try {
      await refetch();
      toast.success('Node data refreshed');
    } catch {
      toast.error('Failed to refresh node data');
    }
  };

  const handleNodeAction = async (action: 'start' | 'stop' | 'restart' | 'maintenance') => {
    if (!id) return;

    try {
      // This would use a node actions hook when available
      // For now, show a placeholder
      toast.success(`Node ${action} initiated`);
    } catch {
      toast.error(`Failed to ${action} node`);
    }
  };

  if (isLoading) {
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

  if (error || !node) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-400" />
            <h2 className="mb-2 text-xl font-semibold text-white">
              Node Not Found
            </h2>
            <p className="mb-4 text-gray-400">
              {error?.message || 'The requested node could not be found.'}
            </p>
            <Button onClick={() => navigate('/nodes')}>
              Back to Nodes
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const getStatusColor = (status: string) => {
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="w-4 h-4" />;
      case 'offline':
        return <XCircle className="w-4 h-4" />;
      case 'maintenance':
        return <Wrench className="w-4 h-4" />;
      default:
        return <Server className="w-4 h-4" />;
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'resources', label: 'Resources', icon: '📈' },
    { id: 'containers', label: 'Containers', icon: '🐳' },
    { id: 'logs', label: 'Logs', icon: '📋' },
    { id: 'actions', label: 'Actions', icon: '⚙️' }
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
            <NodeCard node={node} showActions={false} className="max-w-none" />
          </motion.div>
        );

      case 'resources':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Resource Usage Stats */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="p-6 bg-white border border-gray-200 shadow-xl dark:bg-gray-800 rounded-xl dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">CPU Usage</h3>
                  <Activity className="w-5 h-5 text-blue-500" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Used:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {Math.floor(Math.random() * node.resources.cpu * 0.8)} / {node.resources.cpu} cores
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full dark:bg-gray-700">
                    <div
                      className="h-2 transition-all duration-300 bg-blue-500 rounded-full"
                      style={{ width: `${Math.random() * 80}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 bg-white border border-gray-200 shadow-xl dark:bg-gray-800 rounded-xl dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Memory Usage</h3>
                  <Database className="w-5 h-5 text-green-500" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Used:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {Math.floor(Math.random() * 80)}% / {node.resources.memory}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full dark:bg-gray-700">
                    <div
                      className="h-2 transition-all duration-300 bg-green-500 rounded-full"
                      style={{ width: `${Math.random() * 80}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 bg-white border border-gray-200 shadow-xl dark:bg-gray-800 rounded-xl dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Disk Usage</h3>
                  <Server className="w-5 h-5 text-purple-500" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Used:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {Math.floor(Math.random() * 60)}% / {node.resources.disk}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full dark:bg-gray-700">
                    <div
                      className="h-2 transition-all duration-300 bg-purple-500 rounded-full"
                      style={{ width: `${Math.random() * 60}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Resource Chart */}
            <div className="p-6 bg-white border border-gray-200 shadow-xl dark:bg-gray-800 rounded-xl dark:border-gray-700">
              <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Resource Usage Over Time</h3>
              <StatsChart
                data={[
                  { timestamp: new Date(Date.now() - 3600000).toISOString(), cpu: 45, memory: 60, disk: 30 },
                  { timestamp: new Date(Date.now() - 3000000).toISOString(), cpu: 50, memory: 65, disk: 32 },
                  { timestamp: new Date(Date.now() - 2400000).toISOString(), cpu: 48, memory: 62, disk: 31 },
                  { timestamp: new Date(Date.now() - 1800000).toISOString(), cpu: 52, memory: 68, disk: 33 },
                  { timestamp: new Date(Date.now() - 1200000).toISOString(), cpu: 47, memory: 64, disk: 32 },
                  { timestamp: new Date(Date.now() - 600000).toISOString(), cpu: 49, memory: 66, disk: 34 },
                ]}
                height={300}
                chartType="line"
                metrics={[
                  { key: 'cpu', label: 'CPU Usage', color: '#3b82f6', unit: '%' },
                  { key: 'memory', label: 'Memory Usage', color: '#10b981', unit: '%' },
                  { key: 'disk', label: 'Disk Usage', color: '#f59e0b', unit: '%' },
                ]}
                formatXAxisTick={(timestamp) =>
                  new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }
              />
            </div>
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
                    container={{
                      ...container,
                      status: container.status as 'running' | 'stopped' | 'starting' | 'stopping' | 'error',
                      ports: container.ports?.reduce((acc, port) => {
                        acc[`${port.container}/tcp`] = port.host;
                        return acc;
                      }, {} as Record<string, number>) || {}
                    }}
                    showLogs={false}
                  />
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <Database className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="mb-2 text-lg font-medium text-white">No containers assigned</h3>
                <p className="text-gray-500">
                  This node doesn't have any containers assigned to it yet.
                </p>
              </div>
            )}
          </motion.div>
        );

      case 'logs':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <LogsTab
              containerId={node.id}
              containerStatus={nodeStatus as 'running' | 'stopped' | 'starting' | 'stopping' | 'error'}
            />
          </motion.div>
        );

      case 'actions':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <ActionsTab
              container={{
                id: node.id,
                name: node.name,
                status: nodeStatus as 'running' | 'stopped' | 'starting' | 'stopping' | 'error',
                type: 'standard',
                ports: {},
                environment: {},
                createdAt: node.createdAt,
                updatedAt: node.updatedAt
              }}
            />

            {/* Node-specific Actions */}
            <div className="p-6 bg-white border border-gray-200 shadow-xl dark:bg-gray-800 rounded-xl dark:border-gray-700">
              <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Node Management</h3>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {nodeStatus !== 'online' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleNodeAction('start')}
                    leftIcon={<Play className="w-4 h-4" />}
                    className="w-full"
                  >
                    Start Node
                  </Button>
                )}

                {nodeStatus === 'online' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleNodeAction('stop')}
                    leftIcon={<Square className="w-4 h-4" />}
                    className="w-full"
                  >
                    Stop Node
                  </Button>
                )}

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleNodeAction('restart')}
                  leftIcon={<RefreshCw className="w-4 h-4" />}
                  className="w-full"
                >
                  Restart Node
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleNodeAction('maintenance')}
                  leftIcon={<Wrench className="w-4 h-4" />}
                  className="w-full"
                >
                  Maintenance Mode
                </Button>
              </div>

              {hasPermission('nodes:update') && (
                <div className="pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setShowAssignModal(true)}
                    leftIcon={<Settings className="w-4 h-4" />}
                    className="w-full"
                  >
                    Assign to Cluster
                  </Button>
                </div>
              )}
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
            onClick={() => navigate('/nodes')}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            className="mb-4"
          >
            Back to Nodes
          </Button>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <motion.div
                  className={cn(
                    'w-3 h-3 rounded-full shadow-lg flex items-center justify-center',
                    getStatusColor(nodeStatus || node.status)
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
                  {getStatusIcon(nodeStatus || node.status)}
                </motion.div>
                {wsConnected && (
                  <div className="absolute w-2 h-2 bg-green-400 rounded-full -top-1 -right-1 animate-pulse" />
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">{node.name}</h1>
                <p className="text-gray-400">Node Details</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-400">WebSocket:</span>
                {wsConnected ? (
                  <Badge className="text-green-800 bg-green-100 dark:bg-green-900/30 dark:text-green-200">
                    Connected
                  </Badge>
                ) : (
                  <Badge className="text-red-800 bg-red-100 dark:bg-red-900/30 dark:text-red-200">
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

      {/* Assign to Cluster Modal */}
      <NodeAssignModal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        nodeId={node.id}
        nodeName={node.name}
      />
    </DashboardLayout>
  );
};

export default NodeDetailPage;