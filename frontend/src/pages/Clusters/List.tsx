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
  Eye
} from 'lucide-react';

import DashboardLayout from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useClusters, useDeleteCluster } from '../../hooks/useClusters';
import type { Cluster } from '../../hooks/useEntities';
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
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  searchValue,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  viewMode,
  onViewModeChange
}) => {
  return (
    <div className="flex flex-col mb-6 space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
      <div>
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        <p className="mt-1 text-gray-400">Manage your clusters</p>
      </div>

      <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
          <Input
            placeholder="Search clusters..."
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
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="degraded">Degraded</option>
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
        <Link to="/clusters/create">
          <Button className="text-white bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Create Cluster
          </Button>
        </Link>
      </div>
    </div>
  );
};

// Actions Dropdown Component
const ActionsDropdown: React.FC<{ cluster: Cluster }> = ({ cluster }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { hasPermission } = usePermissions();
  const deleteCluster = useDeleteCluster();

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete cluster "${cluster.name}"?`)) {
      try {
        await deleteCluster.mutateAsync(cluster.id);
        setIsOpen(false);
      } catch (error) {
        console.error('Failed to delete cluster:', error);
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
                  to={`/clusters/${cluster.id}`}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View
                </Link>

                {hasPermission('clusters:update') && (
                  <Link
                    to={`/clusters/${cluster.id}/edit`}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Link>
                )}

                {hasPermission('clusters:delete') && (
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
    </>
  );
};

// Main List Component
const ClustersListPage: React.FC = () => {
  // Local state for filters
  const [searchValue, setSearchValue] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Debounce search input
  const debouncedSearch = useDebounce(searchValue, 300);

  // Build filters object
  const filters = useMemo(() => {
    const filterObj: Record<string, string> = {};

    if (statusFilter) {
      filterObj.status = statusFilter;
    }

    return filterObj;
  }, [statusFilter]);

  // Fetch clusters with filters
  const { data: clustersData, isLoading, error } = useClusters(filters);
  const clusters = clustersData?.clusters || [];
  const pagination = clustersData?.pagination;

  // Filter clusters by search term (client-side)
  const filteredClusters = useMemo(() => {
    if (!debouncedSearch) return clusters as Cluster[];

    return (clusters as Cluster[]).filter(cluster =>
      cluster.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      (cluster.description && cluster.description.toLowerCase().includes(debouncedSearch.toLowerCase())) ||
      cluster.id.toLowerCase().includes(debouncedSearch.toLowerCase())
    );
  }, [clusters, debouncedSearch]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Clusters"
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        {error && (
          <div className="p-4 border rounded-lg bg-red-900/20 border-red-500/50">
            <p className="text-red-400">
              Failed to load clusters: {error.message}
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
                {filteredClusters.map((cluster) => (
                  <div key={cluster.id} className="relative">
                    <Link to={`/clusters/${cluster.id}`}>
                      <div className="bg-gray-800/50 rounded-lg p-6 hover:bg-gray-800/70 transition-colors">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${
                              cluster.status === 'active' ? 'bg-green-500' :
                              cluster.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                            }`} />
                            <div>
                              <h3 className="text-lg font-semibold text-white">
                                {cluster.name}
                              </h3>
                              {cluster.description && (
                                <p className="text-sm text-gray-400">{cluster.description}</p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Nodes:</span>
                            <span className="text-white">{cluster.nodes?.length || 0}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Status:</span>
                            <span className={`capitalize ${
                              cluster.status === 'active' ? 'text-green-400' :
                              cluster.status === 'degraded' ? 'text-yellow-400' : 'text-red-400'
                            }`}>
                              {cluster.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                    <div className="absolute top-4 right-4">
                      <ActionsDropdown cluster={cluster} />
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
                {filteredClusters.map((cluster) => (
                  <motion.div
                    key={cluster.id}
                    className="bg-gray-800/50 rounded-lg p-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Link to={`/clusters/${cluster.id}`} className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            cluster.status === 'active' ? 'bg-green-500' :
                            cluster.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                          }`} />
                          <div>
                            <h3 className="text-lg font-semibold text-white hover:text-blue-400">
                              {cluster.name}
                            </h3>
                            {cluster.description && (
                              <p className="text-sm text-gray-400">{cluster.description}</p>
                            )}
                          </div>
                        </Link>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-400">
                          {cluster.nodes?.length || 0} nodes
                        </span>
                        <ActionsDropdown cluster={cluster} />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {!isLoading && filteredClusters.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-12 text-center"
          >
            <div className="mb-4 text-gray-400">
              <Server className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="mb-2 text-lg font-medium text-white">No clusters found</h3>
              <p className="text-gray-500">
                {debouncedSearch || statusFilter
                  ? 'Try adjusting your search or filters'
                  : 'Get started by creating your first cluster'
                }
              </p>
            </div>
            {!debouncedSearch && !statusFilter && (
              <Link to="/clusters/create">
                <Button className="mt-4 text-white bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Cluster
                </Button>
              </Link>
            )}
          </motion.div>
        )}

        {/* Pagination would go here if needed */}
        {pagination && pagination.pages > 1 && (
          <div className="flex justify-center mt-8">
            <div className="text-sm text-gray-400">
              Page {pagination.page} of {pagination.pages} ({pagination.total} total clusters)
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ClustersListPage;