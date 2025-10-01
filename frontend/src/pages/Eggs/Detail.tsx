import { useState } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Image,
  Loader2,
  RefreshCw,
  Settings,
  Database,
  AlertTriangle,
  Edit,
  Copy,
  Key,
  HardDrive,
  Network
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { EggPreview } from '../../components/entities/EggPreview';
import { ContainerCard } from '../../components/entities/ContainerCard';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useEgg } from '../../hooks/useEggs';
import { useContainers, type Container } from '../../hooks/useContainers';
import { usePermissions } from '../../hooks/usePermissions';
import { cn } from '../../lib/utils';
import toast from 'react-hot-toast';
import type { Egg } from '../../hooks/useEntities';

const EggDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const { hasPermission } = usePermissions();

  // Fetch egg data
  const { data: eggData, isLoading, error, refetch } = useEgg(id || '');
  const egg = eggData as Egg | undefined;

  // Fetch all containers and filter client-side for usage
  const { data: containersData } = useContainers({});
  const allContainers = (containersData as Container[]) || [];
  const containers = allContainers.filter(container => container.eggId === id);

  const handleRefresh = async () => {
    try {
      await refetch();
      toast.success('Egg data refreshed');
    } catch {
      toast.error('Failed to refresh egg data');
    }
  };

  const handleCopyId = () => {
    if (egg?.id) {
      navigator.clipboard.writeText(egg.id);
      toast.success('Egg ID copied to clipboard');
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-neon-blue" />
            <p className="text-gray-400">Loading egg details...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !eggData) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-400" />
            <h2 className="mb-2 text-xl font-semibold text-white">
              Egg Not Found
            </h2>
            <p className="text-gray-400 mb-4">
              {error?.message || 'The requested egg could not be found.'}
            </p>
            <Button onClick={() => navigate('/dashboard/eggs')}>
              Back to Eggs
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📋' },
    { id: 'configuration', label: 'Configuration', icon: '⚙️' },
    { id: 'usage', label: 'Usage', icon: '🐳' }
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
            <EggPreview
              egg={{
                ...egg,
                envVars: egg?.environment || {},
                config: {}
              } as any}
              className="max-w-none"
            />
          </motion.div>
        );

      case 'configuration':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Environment Variables */}
            {egg?.environment && Object.keys(egg.environment).length > 0 && (
              <div className="p-6 bg-white border border-gray-200 shadow-xl dark:bg-gray-800 rounded-xl dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Key className="w-5 h-5 text-green-500" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Environment Variables
                    </h3>
                  </div>
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200">
                    {Object.keys(egg.environment).length} variables
                  </Badge>
                </div>
                <div className="space-y-2">
                  {Object.entries(egg.environment).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <code className="font-mono text-sm text-gray-800 dark:text-gray-200">{key}</code>
                      <code className="font-mono text-sm text-gray-600 dark:text-gray-400">{String(value)}</code>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ports */}
            {egg?.ports && egg.ports.length > 0 && (
              <div className="p-6 bg-white border border-gray-200 shadow-xl dark:bg-gray-800 rounded-xl dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Network className="w-5 h-5 text-blue-500" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Ports
                    </h3>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
                    {egg.ports.length} ports
                  </Badge>
                </div>
                <div className="space-y-2">
                  {egg.ports.map((port: any, index: number) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                          {port.container}
                        </Badge>
                        <span className="text-sm text-gray-600 dark:text-gray-400">→ Container Port</span>
                      </div>
                      <Badge className={`${
                        port.protocol === 'tcp'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                          : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200'
                      }`}>
                        {port.protocol.toUpperCase()}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Volumes */}
            {egg?.volumes && egg.volumes.length > 0 && (
              <div className="p-6 bg-white border border-gray-200 shadow-xl dark:bg-gray-800 rounded-xl dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <HardDrive className="w-5 h-5 text-purple-500" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Volumes
                    </h3>
                  </div>
                  <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200">
                    {egg.volumes.length} volumes
                  </Badge>
                </div>
                <div className="space-y-2">
                  {egg.volumes.map((volume: any, index: number) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <code className="font-mono text-sm text-gray-800 dark:text-gray-200">{volume.container}</code>
                        <span className="text-sm text-gray-600 dark:text-gray-400">→ Container Path</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Host:</span>
                        <code className="font-mono text-sm text-gray-600 dark:text-gray-400">{volume.mount}</code>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {!egg?.environment && !egg?.ports?.length && !egg?.volumes?.length && (
              <div className="py-12 text-center">
                <Settings className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="mb-2 text-lg font-medium text-white">No Configuration</h3>
                <p className="text-gray-500">
                  This egg doesn't have any environment variables, ports, or volumes configured.
                </p>
              </div>
            )}

            {/* Edit Button */}
            {hasPermission('eggs:update') && egg && (
              <div className="flex justify-end">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate(`/dashboard/eggs/${egg.id}/edit`)}
                  leftIcon={<Edit className="w-4 h-4" />}
                >
                  Edit Configuration
                </Button>
              </div>
            )}
          </motion.div>
        );

      case 'usage':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {containers.length > 0 ? (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">
                    Containers using this egg ({containers.length})
                  </h3>
                </div>
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  {containers.map((container) => (
                    <ContainerCard
                      key={container.id}
                      container={{
                        id: container.id,
                        name: container.name,
                        status: (container.status === 'running' || container.status === 'stopped' || container.status === 'starting' || container.status === 'stopping' || container.status === 'error') ? container.status : 'stopped',
                        cpuLimit: container.resources?.cpu,
                        memoryLimit: container.resources?.memory ? parseInt(container.resources.memory) : undefined,
                        diskLimit: container.resources?.disk ? parseInt(container.resources.disk) : undefined,
                        ports: Object.fromEntries(container.ports?.map(p => [`${p.host}:${p.container}`, p.container]) || []),
                        environment: container.environment,
                        createdAt: container.createdAt,
                        updatedAt: container.updatedAt
                      }}
                      showLogs={false}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="py-12 text-center">
                <Database className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="mb-2 text-lg font-medium text-white">No containers found</h3>
                <p className="text-gray-500">
                  No containers are currently using this egg.
                </p>
              </div>
            )}
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
            onClick={() => navigate('/dashboard/eggs')}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            className="mb-4"
          >
            Back to Eggs
          </Button>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-neon-blue/10">
                <Image className="w-6 h-6 text-neon-blue" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">{egg?.name}</h1>
                <p className="text-gray-400">Egg Details</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCopyId}
                leftIcon={<Copy className="w-4 h-4" />}
              >
                Copy ID
              </Button>
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

          {/* Egg Metadata */}
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Image:</span>
              <code className="font-mono text-sm text-gray-300">{egg?.image}</code>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Containers:</span>
              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
                {containers.length} using
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Created:</span>
              <span className="text-sm text-gray-300">
                {egg ? new Date(egg.createdAt).toLocaleDateString() : ''}
              </span>
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
    </DashboardLayout>
  );
};

export default EggDetailPage;