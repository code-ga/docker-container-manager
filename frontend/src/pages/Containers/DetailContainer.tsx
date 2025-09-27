import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Server,
  Shield,
  Activity,
  HardDrive,
  Cpu,
  Zap,
  Loader2,
  RefreshCw,
  History,
  CheckCircle,
  XCircle,
  Terminal,
  Send
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { MigrationStatus } from '../../components/entities/MigrationStatus';
import { ManualMigrate } from '../../components/entities/ManualMigrate';
import { MigrationHistoryTable } from '../../components/entities/MigrationHistoryTable';
import { useContainerLogs } from '../../hooks/useContainerLogs';
import { useContainerHA } from '../../hooks/useContainerHA';
import { apiEndpoints } from '../../lib/api';
import { cn } from '../../lib/utils';
import toast from 'react-hot-toast';

interface Container {
  id: string;
  name: string;
  status: 'running' | 'stopped' | 'starting' | 'stopping' | 'error';
  type: 'standard' | 'ha';
  migrationStatus?: 'idle' | 'migrating' | 'failed';
  currentNode?: string;
  preferredClusterId?: string;
  cpuLimit?: number;
  memoryLimit?: number;
  diskLimit?: number;
  ports: Record<string, number>;
  environment: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}


const DetailContainer = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [container, setContainer] = useState<Container | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showMigrationModal, setShowMigrationModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [stdinInput, setStdinInput] = useState('');

  // Use the container logs hook for real-time logs
  const {
    logs,
    isConnected,
    isReconnecting,
    error: logsError,
    clearLogs,
    sendStdin
  } = useContainerLogs({
    containerId: id || '',
    enabled: !!id,
    maxLogs: 200
  });

  // Use the container HA hook for real-time HA updates
  const {
    migrationStatus,
    isConnected: haConnected
  } = useContainerHA({
    containerId: id || '',
    enabled: !!id
  });

  // Fetch container data
  useEffect(() => {
    const fetchContainer = async () => {
      if (!id) return;

      try {
        setIsLoading(true);
        const response = await apiEndpoints.containers.get(id);

        if (response.success) {
          setContainer(response.data as Container);
        } else {
          toast.error('Failed to load container');
          navigate('/dashboard/containers');
        }
      } catch {
        toast.error('Failed to load container');
        navigate('/dashboard/containers');
      } finally {
        setIsLoading(false);
      }
    };

    fetchContainer();
  }, [id, navigate]);

  // Fetch migration history
  const fetchMigrationHistory = async () => {
    if (!id) return;

    try {
      const response = await apiEndpoints.containers.get(`${id}/migration-history`);
      if (response.success) {
        // Migration history data is handled by the MigrationHistoryTable component
      }
    } catch {
      console.error('Failed to fetch migration history');
    }
  };

  const handleManualMigrate = async (targetNodeId: string) => {
    if (!id) return;

    try {
      const response = await apiEndpoints.containers.migrate(id, {
        targetNodeId
      });

      if (response.success) {
        toast.success('Migration initiated successfully');
        setShowMigrationModal(false);
        // Refresh container data
        const containerResponse = await apiEndpoints.containers.get(id);
        if (containerResponse.success) {
          setContainer(containerResponse.data as Container);
        }
      } else {
        toast.error(response.message || 'Failed to initiate migration');
      }
    } catch {
      toast.error('Failed to initiate migration');
    }
  };

  const handleRefresh = async () => {
    if (!id) return;

    try {
      const response = await apiEndpoints.containers.get(id);
      if (response.success) {
        setContainer(response.data as Container);
        toast.success('Container data refreshed');
      }
    } catch {
      toast.error('Failed to refresh container data');
    }
  };

  const handleSendStdin = () => {
    if (!stdinInput.trim()) {
      toast.error('Please enter some input to send');
      return;
    }

    const success = sendStdin(stdinInput);
    if (success) {
      setStdinInput('');
      toast.success('Input sent to container');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="text-center">
          <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-neon-blue" />
          <p className="text-gray-400">Loading container details...</p>
        </div>
      </div>
    );
  }

  if (!container) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="text-center">
          <XCircle className="w-8 h-8 mx-auto mb-4 text-red-500" />
          <p className="text-gray-400">Container not found</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: Container['status']) => {
    switch (status) {
      case 'running':
        return 'bg-green-500 shadow-green-500/50';
      case 'stopped':
        return 'bg-gray-500 shadow-gray-500/50';
      case 'starting':
        return 'bg-blue-500 shadow-blue-500/50';
      case 'stopping':
        return 'bg-yellow-500 shadow-yellow-500/50';
      case 'error':
        return 'bg-red-500 shadow-red-500/50';
      default:
        return 'bg-gray-500 shadow-gray-500/50';
    }
  };

  const getStatusLabel = (status: Container['status']) => {
    switch (status) {
      case 'running':
        return 'Running';
      case 'stopped':
        return 'Stopped';
      case 'starting':
        return 'Starting';
      case 'stopping':
        return 'Stopping';
      case 'error':
        return 'Error';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="container px-4 py-8 mx-auto">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/dashboard/containers')}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            className="mb-4"
          >
            Back to Containers
          </Button>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Server className="w-8 h-8 text-neon-blue" />
              <div>
                <h1 className="text-3xl font-bold text-white">{container.name}</h1>
                <p className="text-gray-400">Container Details</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleRefresh}
                leftIcon={<RefreshCw className="w-4 h-4" />}
              >
                Refresh
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowHistoryModal(true)}
                leftIcon={<History className="w-4 h-4" />}
              >
                Migration History
              </Button>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <motion.div
            className="space-y-8 lg:col-span-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            {/* Status and HA Information */}
            <div className="p-6 bg-white border border-gray-200 shadow-xl dark:bg-gray-800 rounded-xl dark:border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Status & Configuration
                </h2>
                <div className="flex items-center gap-2">
                  <motion.div
                    className={cn(
                      'w-3 h-3 rounded-full shadow-lg',
                      getStatusColor(container.status)
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
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {getStatusLabel(container.status)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Container Info */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Container Information
                  </h3>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">ID:</span>
                      <span className="font-mono text-sm text-gray-900 dark:text-white">
                        {container.id}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Type:</span>
                      <div className="flex items-center gap-2">
                        {container.type === 'ha' && <Shield className="w-4 h-4 text-neon-blue" />}
                        <span className={cn(
                          'font-medium',
                          container.type === 'ha' ? 'text-neon-blue' : 'text-gray-900 dark:text-white'
                        )}>
                          {container.type === 'ha' ? 'High Availability' : 'Standard'}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Current Node:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {container.currentNode || 'Unknown'}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Created:</span>
                      <span className="text-gray-900 dark:text-white">
                        {new Date(container.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* HA Status */}
                {container.type === 'ha' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      High Availability Status
                    </h3>

                    <div className="space-y-3">
                      <MigrationStatus
                        status={migrationStatus || container.migrationStatus || 'idle'}
                        className="mb-4"
                      />

                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Cluster:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {container.preferredClusterId || 'Default'}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Auto Migration:</span>
                        <span className="font-medium text-green-600 dark:text-green-400">
                          Enabled
                        </span>
                      </div>

                      <div className="pt-4">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => setShowMigrationModal(true)}
                          leftIcon={<RefreshCw className="w-4 h-4" />}
                          className="w-full"
                        >
                          Manual Migration
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Resource Usage */}
            <div className="p-6 bg-white border border-gray-200 shadow-xl dark:bg-gray-800 rounded-xl dark:border-gray-700">
              <h2 className="mb-6 text-xl font-semibold text-gray-900 dark:text-white">
                Resource Limits
              </h2>

              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {container.cpuLimit && (
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-blue-500" />
                    <div>
                      <div className="text-sm font-medium">{container.cpuLimit} CPU</div>
                      <div className="text-xs text-gray-500">Limit</div>
                    </div>
                  </div>
                )}
                {container.memoryLimit && (
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-green-500" />
                    <div>
                      <div className="text-sm font-medium">{container.memoryLimit}MB</div>
                      <div className="text-xs text-gray-500">Memory</div>
                    </div>
                  </div>
                )}
                {container.diskLimit && (
                  <div className="flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-purple-500" />
                    <div>
                      <div className="text-sm font-medium">{container.diskLimit}MB</div>
                      <div className="text-xs text-gray-500">Disk</div>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  <div>
                    <div className="text-sm font-medium">{Object.keys(container.ports).length}</div>
                    <div className="text-xs text-gray-500">Ports</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Logs */}
            <div className="p-6 bg-white border border-gray-200 shadow-xl dark:bg-gray-800 rounded-xl dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    Live Logs
                  </span>
                  {isConnected && (
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-xs text-green-600 dark:text-green-400">Connected</span>
                    </div>
                  )}
                  {isReconnecting && (
                    <div className="flex items-center gap-1">
                      <Loader2 className="w-3 h-3 text-yellow-500 animate-spin" />
                      <span className="text-xs text-yellow-600 dark:text-yellow-400">Reconnecting</span>
                    </div>
                  )}
                  {logsError && (
                    <span className="text-xs text-red-600 dark:text-red-400">Error</span>
                  )}
                </div>
                <button
                  onClick={clearLogs}
                  className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  Clear
                </button>
              </div>

              <div className="p-4 overflow-y-auto bg-gray-900 rounded-lg max-h-96">
                {logs.length === 0 ? (
                  <p className="py-8 text-center text-gray-400">
                    No logs available. Logs will appear here when the container is running.
                  </p>
                ) : (
                  <div className="space-y-1 font-mono text-sm">
                    {logs.map((log) => (
                      <motion.div
                        key={log.id}
                        className={cn(
                          'px-2 py-1 rounded',
                          log.level === 'error' && 'bg-red-900/30 text-red-300',
                          log.level === 'warn' && 'bg-yellow-900/30 text-yellow-300',
                          log.level === 'info' && 'text-gray-300',
                          log.level === 'debug' && 'text-blue-300'
                        )}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                      >
                        <span className="text-gray-500">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>{' '}
                        <span className="text-gray-400">[{log.level.toUpperCase()}]</span>{' '}
                        <span>{log.message}</span>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Stdin Input Section */}
            {container.status === 'running' && (
              <div className="p-6 bg-white border border-gray-200 shadow-xl dark:bg-gray-800 rounded-xl dark:border-gray-700">
                <div className="flex items-center gap-2 mb-4">
                  <Terminal className="w-5 h-5 text-neon-blue" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Send Input
                  </h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Command Input
                    </label>
                    <textarea
                      value={stdinInput}
                      onChange={(e) => setStdinInput(e.target.value)}
                      placeholder="Enter commands to send to the container..."
                      className="w-full px-3 py-2 text-gray-900 placeholder-gray-500 transition-all duration-200 bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neon-blue focus:border-neon-blue dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 resize-vertical"
                      rows={4}
                      disabled={!isConnected}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {isConnected ? (
                        <span className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                          Ready to send input
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-gray-400">
                          <div className="w-2 h-2 bg-gray-400 rounded-full" />
                          Waiting for connection...
                        </span>
                      )}
                    </div>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleSendStdin}
                      leftIcon={<Send className="w-4 h-4" />}
                      disabled={!isConnected || !stdinInput.trim()}
                    >
                      Send Input
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>

          {/* Sidebar */}
          <motion.div
            className="space-y-8 lg:col-span-1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            {/* Quick Actions */}
            <div className="p-6 bg-white border border-gray-200 shadow-xl dark:bg-gray-800 rounded-xl dark:border-gray-700">
              <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                Quick Actions
              </h3>

              <div className="space-y-3">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {/* Handle start */}}
                  leftIcon={<Activity className="w-4 h-4" />}
                  className="w-full"
                  disabled={container.status === 'running'}
                >
                  Start Container
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {/* Handle stop */}}
                  leftIcon={<Activity className="w-4 h-4" />}
                  className="w-full"
                  disabled={container.status === 'stopped'}
                >
                  Stop Container
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {/* Handle restart */}}
                  leftIcon={<RefreshCw className="w-4 h-4" />}
                  className="w-full"
                >
                  Restart Container
                </Button>

                {container.type === 'ha' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setShowMigrationModal(true)}
                    leftIcon={<RefreshCw className="w-4 h-4" />}
                    className="w-full"
                  >
                    Manual Migration
                  </Button>
                )}
              </div>
            </div>

            {/* Connection Status */}
            <div className="p-6 bg-white border border-gray-200 shadow-xl dark:bg-gray-800 rounded-xl dark:border-gray-700">
              <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                Connection Status
              </h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Container Logs:</span>
                  <div className="flex items-center gap-2">
                    {isConnected ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-green-600 dark:text-green-400">Connected</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-red-500" />
                        <span className="text-sm text-red-600 dark:text-red-400">Disconnected</span>
                      </>
                    )}
                  </div>
                </div>

                {container.type === 'ha' && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">HA Updates:</span>
                    <div className="flex items-center gap-2">
                      {haConnected ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-sm text-green-600 dark:text-green-400">Connected</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 text-red-500" />
                          <span className="text-sm text-red-600 dark:text-red-400">Disconnected</span>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Migration Modal */}
        <Modal
          isOpen={showMigrationModal}
          onClose={() => setShowMigrationModal(false)}
          title="Manual Container Migration"
          description="Select a target node to migrate this container to"
        >
          <ManualMigrate
            containerId={container.id}
            currentNode={container.currentNode}
            onMigrate={handleManualMigrate}
            onCancel={() => setShowMigrationModal(false)}
          />
        </Modal>

        {/* Migration History Modal */}
        <Modal
          isOpen={showHistoryModal}
          onClose={() => setShowHistoryModal(false)}
          title="Migration History"
          description="View the migration history for this container"
          size="xl"
        >
          <MigrationHistoryTable
            containerId={container.id}
            onRefresh={fetchMigrationHistory}
          />
        </Modal>
      </div>
    </div>
  );
};

export default DetailContainer;