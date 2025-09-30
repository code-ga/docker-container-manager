import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Play,
  Square,
  RotateCcw,
  Trash2,
  RefreshCw,
  Shield,
  AlertTriangle
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
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

interface ActionsTabProps {
  container: Container;
}

const ActionsTab = ({ container }: ActionsTabProps) => {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showMigrationModal, setShowMigrationModal] = useState(false);

  // Mock functions for container actions - these would be replaced with actual API calls
  const handleAction = async (action: string) => {
    setIsLoading(action);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      switch (action) {
        case 'start':
          toast.success(`Container "${container.name}" started successfully`);
          break;
        case 'stop':
          toast.success(`Container "${container.name}" stopped successfully`);
          break;
        case 'restart':
          toast.success(`Container "${container.name}" restarted successfully`);
          break;
        case 'delete':
          toast.success(`Container "${container.name}" deleted successfully`);
          setShowDeleteModal(false);
          break;
        case 'migrate':
          toast.success(`Container "${container.name}" migration initiated`);
          setShowMigrationModal(false);
          break;
        default:
          throw new Error(`Unknown action: ${action}`);
      }
    } catch {
      toast.error(`Failed to ${action} container`);
    } finally {
      setIsLoading(null);
    }
  };

  const getStatusColor = (status: Container['status']) => {
    switch (status) {
      case 'running':
        return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'stopped':
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
      case 'starting':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
      case 'stopping':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case 'error':
        return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
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
    <div className="space-y-6">
      {/* Current Status */}
      <motion.div
        className="p-6 bg-white border border-gray-200 shadow-xl dark:bg-gray-800 rounded-xl dark:border-gray-700"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
          Current Status
        </h2>
        <div className="flex items-center gap-3">
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(container.status)}`}>
            {getStatusLabel(container.status)}
          </div>
          <span className="text-gray-600 dark:text-gray-400">
            Container is currently {container.status}
          </span>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        className="p-6 bg-white border border-gray-200 shadow-xl dark:bg-gray-800 rounded-xl dark:border-gray-700"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="mb-6 text-xl font-semibold text-gray-900 dark:text-white">
          Container Actions
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Start Action */}
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleAction('start')}
            leftIcon={<Play className="w-4 h-4" />}
            className="w-full"
            disabled={container.status === 'running' || container.status === 'starting'}
            isLoading={isLoading === 'start'}
          >
            Start
          </Button>

          {/* Stop Action */}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleAction('stop')}
            leftIcon={<Square className="w-4 h-4" />}
            className="w-full"
            disabled={container.status === 'stopped' || container.status === 'stopping'}
            isLoading={isLoading === 'stop'}
          >
            Stop
          </Button>

          {/* Restart Action */}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleAction('restart')}
            leftIcon={<RotateCcw className="w-4 h-4" />}
            className="w-full"
            disabled={container.status === 'stopping'}
            isLoading={isLoading === 'restart'}
          >
            Restart
          </Button>

          {/* Delete Action */}
          <Button
            variant="danger"
            size="sm"
            onClick={() => setShowDeleteModal(true)}
            leftIcon={<Trash2 className="w-4 h-4" />}
            className="w-full"
            disabled={isLoading !== null}
          >
            Delete
          </Button>
        </div>
      </motion.div>

      {/* High Availability Actions */}
      {container.type === 'ha' && (
        <motion.div
          className="p-6 bg-white border border-gray-200 shadow-xl dark:bg-gray-800 rounded-xl dark:border-gray-700"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-2 mb-6">
            <Shield className="w-5 h-5 text-neon-blue" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              High Availability Actions
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowMigrationModal(true)}
              leftIcon={<RefreshCw className="w-4 h-4" />}
              className="w-full"
              disabled={isLoading !== null}
            >
              Manual Migration
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleAction('failover')}
              leftIcon={<Shield className="w-4 h-4" />}
              className="w-full"
              disabled={isLoading !== null}
              isLoading={isLoading === 'failover'}
            >
              Force Failover
            </Button>
          </div>
        </motion.div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Container"
        description={`Are you sure you want to delete the container "${container.name}"? This action cannot be undone.`}
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-900/20">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <div>
              <p className="text-sm font-medium text-red-800 dark:text-red-200">
                This will permanently delete the container and all its data.
              </p>
              <p className="text-sm text-red-600 dark:text-red-300">
                Container ID: {container.id}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="danger"
              onClick={() => handleAction('delete')}
              leftIcon={<Trash2 className="w-4 h-4" />}
              isLoading={isLoading === 'delete'}
              className="flex-1"
            >
              Yes, Delete Container
            </Button>
            <Button
              variant="secondary"
              onClick={() => setShowDeleteModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Migration Modal */}
      <Modal
        isOpen={showMigrationModal}
        onClose={() => setShowMigrationModal(false)}
        title="Manual Container Migration"
        description="Select a target node to migrate this container to"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
            <div className="flex items-center gap-2 mb-2">
              <RefreshCw className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Migration Details
              </span>
            </div>
            <p className="text-sm text-blue-600 dark:text-blue-300">
              Current Node: {container.currentNode || 'Unknown'}
            </p>
            <p className="text-sm text-blue-600 dark:text-blue-300">
              Target Node: Auto-selected based on cluster availability
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              variant="primary"
              onClick={() => handleAction('migrate')}
              leftIcon={<RefreshCw className="w-4 h-4" />}
              isLoading={isLoading === 'migrate'}
              className="flex-1"
            >
              Start Migration
            </Button>
            <Button
              variant="secondary"
              onClick={() => setShowMigrationModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export { ActionsTab };