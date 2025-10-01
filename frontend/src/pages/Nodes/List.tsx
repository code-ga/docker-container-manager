import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search,
  Plus,
  MoreVertical,
  Server,
  Grid,
  List as ListIcon,
  Trash2,
  Edit,
  Link as LinkIcon
} from 'lucide-react';

import DashboardLayout from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { NodeCard } from '../../components/entities/NodeCard';
import { NodeAssignModal } from '../../components/entities/NodeAssignModal';
import { useNodes, useDeleteNode } from '../../hooks/useNodes';
import type { Node, Cluster } from '../../hooks/useEntities';
import { useClusters } from '../../hooks/useClusters';
import { usePermissions } from '../../hooks/usePermissions';

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
  clusterFilter: string;
  onClusterFilterChange: (clusterId: string) => void;
  clusters: Cluster[];
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  searchValue,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  clusterFilter,
  onClusterFilterChange,
  clusters,
  viewMode,
  onViewModeChange
}) => {
  return (
    <div className="flex flex-col mb-6 space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
      <div>
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        <p className="mt-1 text-gray-400">Manage your nodes</p>
      </div>

      <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
          <Input
            placeholder="Search nodes..."
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
          <option value="online">Online</option>
          <option value="offline">Offline</option>
          <option value="maintenance">Maintenance</option>
        </select>

        {/* Cluster Filter */}
        <select
          value={clusterFilter}
          onChange={(e) => onClusterFilterChange(e.target.value)}
          className="px-3 py-2 text-sm text-white border border-gray-600 rounded-md bg-gray-800/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Clusters</option>
          {clusters.map((cluster) => (
            <option key={cluster.id} value={cluster.id}>
              {cluster.name}
            </option>
          ))}
        </select>

        {/* View Mode Toggle */}
        <div className="flex border border-gray-600 rounded-md">
          <Button
            variant={viewMode === 'grid' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => onViewModeChange('grid')}
            className="rounded-r-none"
          >
            <Grid className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => onViewModeChange('list')}
            className="rounded-l-none"
          >
            <ListIcon className="w-4 h-4" />
          </Button>
        </div>

        {/* Create Button */}
        <Link to="/nodes/create">
          <Button className="text-white bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Create Node
          </Button>
        </Link>
      </div>
    </div>
  );
};

// Actions Dropdown Component
const ActionsDropdown: React.FC<{ node: Node }> = ({ node }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const { hasPermission } = usePermissions();
  const deleteNode = useDeleteNode();

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete node "${node.name}"?`)) {
      try {
        await deleteNode.mutateAsync(node.id);
        setIsOpen(false);
      } catch (error) {
        console.error('Failed to delete node:', error);
      }
    }
  };

  return (
    <>
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
                <Link
                  to={`/nodes/${node.id}/edit`}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Link>

                {hasPermission('nodes:update') && (
                  <button
                    onClick={() => {
                      setShowAssignModal(true);
                      setIsOpen(false);
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                  >
                    <LinkIcon className="w-4 h-4 mr-2" />
                    Assign to Cluster
                  </button>
                )}

                {hasPermission('nodes:delete') && (
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

      <NodeAssignModal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        nodeId={node.id}
        nodeName={node.name}
      />
    </>
  );
};

// Main List Component
const NodesListPage: React.FC = () => {
  // Local state for filters
  const [searchValue, setSearchValue] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [clusterFilter, setClusterFilter] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Debounce search input
  const debouncedSearch = useDebounce(searchValue, 300);

  // Fetch clusters for filter dropdown
  const { data: clustersData } = useClusters();
  const clusters = clustersData?.clusters || [];

  // Build filters object
  const filters = useMemo(() => {
    const filterObj: Record<string, string> = {};

    if (statusFilter) {
      filterObj.status = statusFilter;
    }

    if (clusterFilter) {
      filterObj.clusterId = clusterFilter;
    }

    return filterObj;
  }, [statusFilter, clusterFilter]);

  // Fetch nodes with filters
  const { data: nodesData, isLoading, error } = useNodes(filters);
  const nodes = nodesData?.nodes || [];
  const pagination = nodesData?.pagination;

  // Filter nodes by search term (client-side)
  const filteredNodes = useMemo(() => {
    if (!debouncedSearch) return nodes as Node[];

    return (nodes as Node[]).filter(node =>
      node.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      (node.description && node.description.toLowerCase().includes(debouncedSearch.toLowerCase())) ||
      node.id.toLowerCase().includes(debouncedSearch.toLowerCase())
    );
  }, [nodes, debouncedSearch]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Nodes"
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          clusterFilter={clusterFilter}
          onClusterFilterChange={setClusterFilter}
          clusters={clusters}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        {error && (
          <div className="p-4 border rounded-lg bg-red-900/20 border-red-500/50">
            <p className="text-red-400">
              Failed to load nodes: {error.message}
            </p>
          </div>
        )}

        {/* Grid View */}
        {viewMode === 'grid' && (
          <>
            {isLoading ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-gray-800/50 rounded-lg p-6 animate-pulse">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-gray-700 rounded-full" />
                        <div>
                          <div className="w-32 h-5 bg-gray-700 rounded mb-2" />
                          <div className="w-20 h-4 bg-gray-700 rounded" />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="w-full h-2 bg-gray-700 rounded" />
                      <div className="w-full h-2 bg-gray-700 rounded" />
                      <div className="w-full h-2 bg-gray-700 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <motion.div
                className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {filteredNodes.map((node) => (
                  <div key={node.id} className="relative">
                    <Link to={`/nodes/${node.id}`}>
                      <NodeCard node={node} showActions={false} />
                    </Link>
                    <div className="absolute top-4 right-4">
                      <ActionsDropdown node={node} />
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <div className="space-y-4">
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="bg-gray-800/50 rounded-lg p-6 animate-pulse">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-3 h-3 bg-gray-700 rounded-full" />
                        <div>
                          <div className="w-32 h-5 bg-gray-700 rounded mb-2" />
                          <div className="w-48 h-4 bg-gray-700 rounded" />
                        </div>
                      </div>
                      <div className="w-24 h-8 bg-gray-700 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredNodes.map((node) => (
                  <motion.div
                    key={node.id}
                    className="bg-gray-800/50 rounded-lg p-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Link to={`/nodes/${node.id}`} className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            node.status === 'online' ? 'bg-green-500' :
                            node.status === 'offline' ? 'bg-red-500' : 'bg-yellow-500'
                          }`} />
                          <div>
                            <h3 className="text-lg font-semibold text-white hover:text-blue-400">
                              {node.name}
                            </h3>
                            {node.description && (
                              <p className="text-sm text-gray-400">{node.description}</p>
                            )}
                          </div>
                        </Link>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-400">
                          {node.containers.length} containers
                        </span>
                        <ActionsDropdown node={node} />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {!isLoading && filteredNodes.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-12 text-center"
          >
            <div className="mb-4 text-gray-400">
              <Server className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="mb-2 text-lg font-medium text-white">No nodes found</h3>
              <p className="text-gray-500">
                {debouncedSearch || statusFilter || clusterFilter
                  ? 'Try adjusting your search or filters'
                  : 'Get started by creating your first node'
                }
              </p>
            </div>
            {!debouncedSearch && !statusFilter && !clusterFilter && (
              <Link to="/nodes/create">
                <Button className="mt-4 text-white bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Node
                </Button>
              </Link>
            )}
          </motion.div>
        )}

        {/* Pagination would go here if needed */}
        {pagination && pagination.pages > 1 && (
          <div className="flex justify-center mt-8">
            <div className="text-sm text-gray-400">
              Page {pagination.page} of {pagination.pages} ({pagination.total} total nodes)
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default NodesListPage;