import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, CheckCircle, XCircle, Clock, ArrowUpDown } from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';
import toast from 'react-hot-toast';

interface MigrationRecord {
  id: string;
  fromNode: string;
  toNode: string;
  status: 'success' | 'failed' | 'in_progress';
  timestamp: string;
  duration?: number;
  reason?: string;
}

export interface MigrationHistoryTableProps {
  containerId: string;
  onRefresh?: () => void;
  className?: string;
}

export const MigrationHistoryTable = ({
  containerId,
  onRefresh,
  className
}: MigrationHistoryTableProps) => {
  const [migrations, setMigrations] = useState<MigrationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortField, setSortField] = useState<'timestamp' | 'status' | 'duration'>('timestamp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Mock data - in real implementation, this would come from API
  useEffect(() => {
    const fetchMigrationHistory = async () => {
      setIsLoading(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        const mockMigrations: MigrationRecord[] = [
          {
            id: 'mig-1',
            fromNode: 'node-01',
            toNode: 'node-02',
            status: 'success',
            timestamp: '2024-01-15T10:30:00Z',
            duration: 45,
            reason: 'Load balancing'
          },
          {
            id: 'mig-2',
            fromNode: 'node-02',
            toNode: 'node-03',
            status: 'failed',
            timestamp: '2024-01-15T09:15:00Z',
            duration: 120,
            reason: 'Node maintenance'
          },
          {
            id: 'mig-3',
            fromNode: 'node-03',
            toNode: 'node-01',
            status: 'success',
            timestamp: '2024-01-15T08:45:00Z',
            duration: 30,
            reason: 'Performance optimization'
          },
          {
            id: 'mig-4',
            fromNode: 'node-01',
            toNode: 'node-02',
            status: 'in_progress',
            timestamp: '2024-01-15T08:00:00Z',
            reason: 'Resource optimization'
          }
        ];

        setMigrations(mockMigrations);
      } catch {
        toast.error('Failed to load migration history');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMigrationHistory();
  }, [containerId]);

  const handleSort = (field: 'timestamp' | 'status' | 'duration') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedMigrations = React.useMemo(() => {
   return [...migrations].sort((a, b) => {
     let aValue: string | number | undefined = a[sortField];
     let bValue: string | number | undefined = b[sortField];

     if (sortField === 'timestamp') {
       aValue = new Date(aValue as string).getTime();
       bValue = new Date(bValue as string).getTime();
     }

      if (sortDirection === 'asc') {
        return (aValue ?? 0) > (bValue ?? 0) ? 1 : -1;
      } else {
        return (aValue ?? 0) < (bValue ?? 0) ? 1 : -1;
      }
    });
  }, [migrations, sortField, sortDirection]);

  const getStatusIcon = (status: MigrationRecord['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: MigrationRecord['status']) => {
    switch (status) {
      case 'success':
        return 'text-green-600 dark:text-green-400';
      case 'failed':
        return 'text-red-600 dark:text-red-400';
      case 'in_progress':
        return 'text-blue-600 dark:text-blue-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="w-6 h-6 animate-spin text-neon-blue" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">
          Loading migration history...
        </span>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Migration History
        </h3>
        <Button
          variant="secondary"
          size="sm"
          onClick={onRefresh}
          leftIcon={<RefreshCw className="w-4 h-4" />}
        >
          Refresh
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-hidden border border-gray-200 rounded-lg dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left">
                  <button
                    className="flex items-center gap-1 text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                    onClick={() => handleSort('timestamp')}
                  >
                    Timestamp
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left">
                  <span className="text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                    From → To
                  </span>
                </th>
                <th className="px-4 py-3 text-left">
                  <button
                    className="flex items-center gap-1 text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                    onClick={() => handleSort('status')}
                  >
                    Status
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left">
                  <button
                    className="flex items-center gap-1 text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                    onClick={() => handleSort('duration')}
                  >
                    Duration
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left">
                  <span className="text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                    Reason
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
              {sortedMigrations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    No migration history found
                  </td>
                </tr>
              ) : (
                sortedMigrations.map((migration, index) => (
                  <motion.tr
                    key={migration.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {new Date(migration.timestamp).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(migration.timestamp).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-gray-900 dark:text-white">
                          {migration.fromNode}
                        </span>
                        <span className="text-gray-400">→</span>
                        <span className="font-mono text-sm text-gray-900 dark:text-white">
                          {migration.toNode}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(migration.status)}
                        <span className={cn('text-sm font-medium', getStatusColor(migration.status))}>
                          {migration.status === 'in_progress' ? 'In Progress' :
                           migration.status === 'success' ? 'Success' : 'Failed'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900 dark:text-white">
                        {formatDuration(migration.duration)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {migration.reason || 'N/A'}
                      </span>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      {sortedMigrations.length > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>
            Showing {sortedMigrations.length} migration{sortedMigrations.length !== 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>{sortedMigrations.filter(m => m.status === 'success').length} Success</span>
            </div>
            <div className="flex items-center gap-1">
              <XCircle className="w-4 h-4 text-red-500" />
              <span>{sortedMigrations.filter(m => m.status === 'failed').length} Failed</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4 text-blue-500" />
              <span>{sortedMigrations.filter(m => m.status === 'in_progress').length} In Progress</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};