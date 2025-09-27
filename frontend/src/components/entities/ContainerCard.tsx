import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Square, RotateCcw, Trash2, Activity, HardDrive, Cpu, Zap, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { FormBuilder } from '../data/FormBuilder';
import type { FormField } from '../data/FormBuilder';
import { LogViewer } from './LogViewer';
import { useContainerLogs } from '../../hooks/useContainerLogs';
import { cn } from '../../lib/utils';

export interface Container {
  id: string;
  name: string;
  status: 'running' | 'stopped' | 'starting' | 'stopping' | 'error';
  cpuLimit?: number;
  memoryLimit?: number;
  diskLimit?: number;
  ports: Record<string, number>;
  environment: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface ContainerCardProps {
  container: Container;
  onAction?: (containerId: string, action: string, data?: Record<string, unknown>) => void;
  className?: string;
  showLogs?: boolean;
}

const ContainerCard = ({ container, onAction, className, showLogs = true }: ContainerCardProps) => {
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [currentAction, setCurrentAction] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // Use the container logs hook for real-time logs
  const {
    logs,
    isConnected,
    isReconnecting,
    error: logsError,
    clearLogs
  } = useContainerLogs({
    containerId: container.id,
    enabled: showLogs && container.status === 'running',
    maxLogs: 100
  });

  // Subscribe/unsubscribe to logs based on container status
  useEffect(() => {
    if (showLogs && container.status === 'running' && isConnected) {
      // Subscribe logic would be here if needed
    }
  }, [showLogs, container.status, isConnected]);

  const handleAction = async (data: Record<string, unknown>) => {
    if (onAction) {
      setIsLoading(true);
      await onAction(container.id, currentAction, data);
      setIsActionModalOpen(false);
      setIsLoading(false);
    }
  };

  const handleQuickAction = async (action: string) => {
    if (onAction) {
      setIsLoading(true);
      await onAction(container.id, action);
      setIsLoading(false);
    }
  };

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


  const actionFields: FormField[] = [
    {
      name: 'confirm',
      label: `Confirm ${currentAction} action`,
      type: 'text',
      required: true,
      placeholder: `Type "${container.name}" to confirm`
    }
  ];

  return (
    <>
      <motion.div
        className={cn(
          'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition-shadow duration-200',
          className
        )}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
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
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {container.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {getStatusLabel(container.status)}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            {container.status === 'stopped' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleQuickAction('start')}
                leftIcon={<Play className="w-4 h-4" />}
                isLoading={isLoading}
              >
                Start
              </Button>
            )}
            {container.status === 'running' && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleQuickAction('stop')}
                leftIcon={<Square className="w-4 h-4" />}
                isLoading={isLoading}
              >
                Stop
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleQuickAction('restart')}
              leftIcon={<RotateCcw className="w-4 h-4" />}
              isLoading={isLoading}
            >
              Restart
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                setCurrentAction('delete');
                setIsActionModalOpen(true);
              }}
              leftIcon={<Trash2 className="w-4 h-4" />}
              isLoading={isLoading}
            >
              Delete
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4 md:grid-cols-4">
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

        {showLogs && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
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
            <LogViewer logs={logs} maxHeight="200px" />
          </div>
        )}

        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
          Created: {new Date(container.createdAt).toLocaleDateString()}
        </div>
      </motion.div>

      <Modal
        isOpen={isActionModalOpen}
        onClose={() => setIsActionModalOpen(false)}
        title={`Confirm ${currentAction} Container`}
        description={`Are you sure you want to ${currentAction} the container "${container.name}"?`}
      >
        <FormBuilder
          fields={actionFields}
          onSubmit={handleAction}
          submitLabel={`${currentAction} Container`}
          isLoading={isLoading}
        />
      </Modal>
    </>
  );
};

export { ContainerCard };