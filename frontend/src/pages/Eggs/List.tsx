import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search,
  Plus,
  MoreVertical,
  Image,
  Grid,
  List as ListIcon,
  Trash2,
  Edit,
  Eye,
  Copy
} from 'lucide-react';

import DashboardLayout from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { EggPreview } from '../../components/entities/EggPreview';
import { useEggs, useDeleteEgg } from '../../hooks/useEggs';
import type { Egg } from '../../hooks/useEntities';
import { usePermissions } from '../../hooks/usePermissions';
import { useContainers, type Container } from '../../hooks/useContainers';

// Debounce utility
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  React.useEffect(() => {
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
  imageFilter: string;
  onImageFilterChange: (image: string) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  searchValue,
  onSearchChange,
  imageFilter,
  onImageFilterChange,
  viewMode,
  onViewModeChange
}) => {
  return (
    <div className="flex flex-col mb-6 space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
      <div>
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        <p className="mt-1 text-gray-400">Manage your container eggs</p>
      </div>

      <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
          <Input
            placeholder="Search eggs..."
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 text-white placeholder-gray-400 border-gray-600 bg-gray-800/50 sm:w-64"
          />
        </div>

        {/* Image Filter */}
        <select
          value={imageFilter}
          onChange={(e) => onImageFilterChange(e.target.value)}
          className="px-3 py-2 text-sm text-white border border-gray-600 rounded-md bg-gray-800/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Images</option>
          <option value="nginx">Nginx</option>
          <option value="node">Node.js</option>
          <option value="postgres">PostgreSQL</option>
          <option value="redis">Redis</option>
          <option value="mysql">MySQL</option>
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
        <Link to="/dashboard/eggs/create">
          <Button className="text-white bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Create Egg
          </Button>
        </Link>
      </div>
    </div>
  );
};

// Actions Dropdown Component
const ActionsDropdown: React.FC<{ egg: Egg }> = ({ egg }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { hasPermission } = usePermissions();
  const deleteEgg = useDeleteEgg();

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete egg "${egg.name}"?`)) {
      try {
        await deleteEgg.mutateAsync(egg.id);
        setIsOpen(false);
      } catch (error) {
        console.error('Failed to delete egg:', error);
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
                  to={`/dashboard/eggs/${egg.id}`}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View
                </Link>

                {hasPermission('eggs:update') && (
                  <Link
                    to={`/dashboard/eggs/${egg.id}/edit`}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Link>
                )}

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(egg.id);
                    setIsOpen(false);
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy ID
                </button>

                {hasPermission('eggs:delete') && (
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
const EggsListPage: React.FC = () => {
  // Local state for filters
  const [searchValue, setSearchValue] = useState('');
  const [imageFilter, setImageFilter] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Debounce search input
  const debouncedSearch = useDebounce(searchValue, 300);

  // Build filters object
  const filters = useMemo(() => {
    const filterObj: Record<string, string> = {};

    if (imageFilter) {
      filterObj.image = imageFilter;
    }

    return filterObj;
  }, [imageFilter]);

  // Fetch eggs with filters
  const { data: eggsData, isLoading, error } = useEggs(filters);
  const eggs = eggsData?.eggs || [];
  const pagination = eggsData?.pagination;

  // Fetch containers to show usage count
  const { data: containersData } = useContainers({});
  const containers = (containersData as Container[]) || [];

  // Filter eggs by search term (client-side)
  const filteredEggs = useMemo(() => {
    if (!debouncedSearch) return eggs as Egg[];

    return (eggs as Egg[]).filter(egg =>
      egg.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      (egg.description && egg.description.toLowerCase().includes(debouncedSearch.toLowerCase())) ||
      egg.image.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      egg.id.toLowerCase().includes(debouncedSearch.toLowerCase())
    );
  }, [eggs, debouncedSearch]);

  // Get usage count for each egg
  const getUsageCount = (eggId: string) => {
    return containers.filter((container: Container) => container.eggId === eggId).length;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Eggs"
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          imageFilter={imageFilter}
          onImageFilterChange={setImageFilter}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        {error && (
          <div className="p-4 border rounded-lg bg-red-900/20 border-red-500/50">
            <p className="text-red-400">
              Failed to load eggs: {error.message}
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
                        <div className="w-12 h-12 bg-gray-700 rounded-full" />
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
                {filteredEggs.map((egg) => (
                  <div key={egg.id} className="relative">
                    <Link to={`/dashboard/eggs/${egg.id}`}>
                      <EggPreview egg={{
                        ...egg,
                        envVars: egg.environment || {},
                        config: {}
                      }} />
                    </Link>
                    <div className="absolute top-4 right-4">
                      <ActionsDropdown egg={egg} />
                    </div>
                    <div className="absolute bottom-4 left-4">
                      <div className="text-xs text-gray-400">
                        Used in {getUsageCount(egg.id)} containers
                      </div>
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
                        <div className="w-12 h-12 bg-gray-700 rounded-full" />
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
                {filteredEggs.map((egg) => (
                  <motion.div
                    key={egg.id}
                    className="bg-gray-800/50 rounded-lg p-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Link to={`/dashboard/eggs/${egg.id}`} className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-neon-blue/10">
                            <Image className="w-6 h-6 text-neon-blue" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-white hover:text-blue-400">
                              {egg.name}
                            </h3>
                            <p className="text-sm text-gray-400 font-mono">{egg.image}</p>
                            {egg.description && (
                              <p className="text-sm text-gray-400">{egg.description}</p>
                            )}
                          </div>
                        </Link>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-400">
                          {getUsageCount(egg.id)} containers
                        </span>
                        <div className="flex gap-2">
                          <div className="text-xs text-gray-400">
                            Ports: {egg.ports?.length || 0}
                          </div>
                          <div className="text-xs text-gray-400">
                            Vols: {egg.volumes?.length || 0}
                          </div>
                        </div>
                        <ActionsDropdown egg={egg} />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {!isLoading && filteredEggs.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-12 text-center"
          >
            <div className="mb-4 text-gray-400">
              <Image className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="mb-2 text-lg font-medium text-white">No eggs found</h3>
              <p className="text-gray-500">
                {debouncedSearch || imageFilter
                  ? 'Try adjusting your search or filters'
                  : 'Get started by creating your first egg'
                }
              </p>
            </div>
            {!debouncedSearch && !imageFilter && (
              <Link to="/dashboard/eggs/create">
                <Button className="mt-4 text-white bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Egg
                </Button>
              </Link>
            )}
          </motion.div>
        )}

        {/* Pagination would go here if needed */}
        {pagination && pagination.pages > 1 && (
          <div className="flex justify-center mt-8">
            <div className="text-sm text-gray-400">
              Page {pagination.page} of {pagination.pages} ({pagination.total} total eggs)
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default EggsListPage;