import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search,
  Plus,
  MoreVertical,
  Play,
  Square,
  RotateCcw,
  Edit,
  Trash2,
  Server
} from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';

import DashboardLayout from '../../components/layout/DashboardLayout';
import { DataTable } from '../../components/data/DataTable';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { NodeStatus } from '../../components/entities/NodeStatus';

import { useContainers, useContainerActions } from '../../hooks/useContainers';
import { useNodes } from '../../hooks/useEntities';
import type { Container } from '../../hooks/useContainers';
import type { Node } from '../../hooks/useEntities';

// Debounce utility
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Page Header Component
interface PageHeaderProps {
  title: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  nodeFilter: string;
  onNodeFilterChange: (nodeId: string) => void;
  nodes: Node[];
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  searchValue,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  nodeFilter,
  onNodeFilterChange,
  nodes
}) => {
  return (
    <div className="flex flex-col mb-6 space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
      <div>
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        <p className="mt-1 text-gray-400">Manage your containers</p>
      </div>

      <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
          <Input
            placeholder="Search containers..."
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 text-white placeholder-gray-400 border-gray-600 bg-gray-800/50 sm:w-64"
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          className="px-3 py-2 text-sm text-white border border-gray-600 rounded-md bg-gray-800/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Statuses</option>
          <option value="running">Running</option>
          <option value="stopped">Stopped</option>
          <option value="exited">Exited</option>
          <option value="created">Created</option>
        </select>

        {/* Node Filter */}
        <select
          value={nodeFilter}
          onChange={(e) => onNodeFilterChange(e.target.value)}
          className="px-3 py-2 text-sm text-white border border-gray-600 rounded-md bg-gray-800/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Nodes</option>
          {nodes.map((node) => (
            <option key={node.id} value={node.id}>
              {node.name}
            </option>
          ))}
        </select>

        {/* Create Button */}
        <Link to="/containers/create">
          <Button className="text-white bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Create Container
          </Button>
        </Link>
      </div>
    </div>
  );
};

// Status Badge Component
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const statusConfig = {
    running: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
    stopped: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
    exited: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200',
    created: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
    restarting: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
  };

  return (
    <Badge className={statusConfig[status as keyof typeof statusConfig] || statusConfig.stopped}>
      {status}
    </Badge>
  );
};

// Actions Dropdown Component
const ActionsDropdown: React.FC<{ container: Container }> = ({ container }) => {
  const containerActions = useContainerActions();
  const [isOpen, setIsOpen] = useState(false);

  // Stub for permissions - always true as per requirements
  const hasPermission = () => true;

  const handleAction = async (action: 'start' | 'stop' | 'restart') => {
    try {
      await containerActions.mutateAsync({ id: container.id, action });
      setIsOpen(false);
    } catch (error) {
      console.error(`Failed to ${action} container:`, error);
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete container "${container.name}"?`)) {
      try {
        // We'll need to import useDeleteContainer for this
        // For now, just show a placeholder
        alert('Delete functionality would be implemented here');
        setIsOpen(false);
      } catch (error) {
        console.error('Failed to delete container:', error);
      }
    }
  };

  return (
    <div className="relative">
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="text-gray-400 hover:text-white"
      >
        <MoreVertical className="w-4 h-4" />
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute right-0 z-20 w-48 mt-1 bg-gray-800 border border-gray-700 rounded-md shadow-lg"
          >
            <div className="py-1">
              {hasPermission() && (
                <button
                  onClick={() => handleAction('start')}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start
                </button>
              )}

              {hasPermission() && (
                <button
                  onClick={() => handleAction('stop')}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                >
                  <Square className="w-4 h-4 mr-2" />
                  Stop
                </button>
              )}

              {hasPermission() && (
                <button
                  onClick={() => handleAction('restart')}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Restart
                </button>
              )}

              <Link
                to={`/containers/${container.id}/edit`}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Link>

              {hasPermission() && (
                <button
                  onClick={handleDelete}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-400 hover:bg-gray-700 hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
};

// Main List Component
const ContainersListPage: React.FC = () => {
  // Local state for filters
  const [searchValue, setSearchValue] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [nodeFilter, setNodeFilter] = useState('');

  // Debounce search input
  const debouncedSearch = useDebounce(searchValue, 300);

  // Fetch nodes for filter dropdown
  const { data: nodesData } = useNodes();
  const nodes = nodesData?.nodes || [];

  // Build filters object
  const filters = useMemo(() => {
    const filterObj: Record<string, string> = {};

    if (statusFilter) {
      filterObj.status = statusFilter;
    }

    if (nodeFilter) {
      filterObj.nodeId = nodeFilter;
    }

    // For search, we'll filter client-side since the API might not support name search
    return filterObj;
  }, [statusFilter, nodeFilter]);

  // Fetch containers with filters
  const { data: containers = [], isLoading, error } = useContainers(filters);

  // Filter containers by search term (client-side)
  const filteredContainers = useMemo(() => {
    if (!debouncedSearch) return containers as Container[];

    return (containers as Container[]).filter(container =>
      container.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      container.id.toLowerCase().includes(debouncedSearch.toLowerCase())
    );
  }, [containers, debouncedSearch]);

  // Define table columns
  const columns = useMemo<ColumnDef<Container>[]>(() => [
    {
      accessorKey: 'id',
      header: 'ID',
      cell: ({ getValue }) => (
        <span className="font-mono text-xs text-gray-400">
          {(getValue() as string).substring(0, 8)}...
        </span>
      ),
    },
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <Link
          to={`/containers/${row.original.id}`}
          className="font-medium text-blue-400 hover:text-blue-300"
        >
          {row.original.name}
        </Link>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue }) => <StatusBadge status={getValue() as string} />,
    },
    {
      accessorKey: 'nodeId',
      header: 'Node',
      cell: ({ getValue }) => {
        const nodeId = getValue() as string;
        const node = (nodes as Node[]).find((n: Node) => n.id === nodeId);

        if (node) {
          return (
            <div className="flex items-center space-x-2">
              <NodeStatus status={node.status} showLabel={false} />
              <span className="text-sm text-gray-300">{node.name}</span>
            </div>
          );
        }

        return (
          <div className="flex items-center space-x-2">
            <Server className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-400">Unknown Node</span>
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => <ActionsDropdown container={row.original} />,
    },
  ], [nodes]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Containers"
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          nodeFilter={nodeFilter}
          onNodeFilterChange={setNodeFilter}
          nodes={nodes}
        />

        {error && (
          <div className="p-4 border rounded-lg bg-red-900/20 border-red-500/50">
            <p className="text-red-400">
              Failed to load containers: {error.message}
            </p>
          </div>
        )}

        <DataTable
          data={filteredContainers}
          columns={columns}
          searchPlaceholder="Search containers..."
          isLoading={isLoading}
          className="border-gray-700 bg-gray-800/50"
        />

        {!isLoading && filteredContainers.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-12 text-center"
          >
            <div className="mb-4 text-gray-400">
              <Server className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="mb-2 text-lg font-medium text-white">No containers found</h3>
              <p className="text-gray-500">
                {debouncedSearch || statusFilter || nodeFilter
                  ? 'Try adjusting your search or filters'
                  : 'Get started by creating your first container'
                }
              </p>
            </div>
            {!debouncedSearch && !statusFilter && !nodeFilter && (
              <Link to="/containers/create">
                <Button className="mt-4 text-white bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Container
                </Button>
              </Link>
            )}
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ContainersListPage;