import React, { useState, useEffect, useMemo } from 'react';
import { Input } from '../ui/Input';
import { useNodes } from '../../hooks/useEntities';
import type { Node } from '../../hooks/useEntities';
import { cn } from '../../lib/utils';

export interface FilterState {
  search: string;
  status?: string;
  nodeId?: string;
}

interface SearchAndFiltersProps {
  onFiltersChange: (filters: FilterState) => void;
  availableStatuses?: string[];
  showStatusFilter?: boolean;
  showNodeFilter?: boolean;
  className?: string;
  placeholder?: string;
}

// Custom debounce hook
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

export const SearchAndFilters: React.FC<SearchAndFiltersProps> = ({
  onFiltersChange,
  availableStatuses = ['active', 'inactive', 'error', 'pending'],
  showStatusFilter = true,
  showNodeFilter = true,
  className,
  placeholder = 'Search...',
}) => {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('');
  const [nodeId, setNodeId] = useState<string>('');

  // Debounce search input
  const debouncedSearch = useDebounce(search, 300);

  // Fetch nodes for node filter
  const { data: nodes = [] } = useNodes() as { data: Node[] | undefined };

  // Memoize filter state to prevent unnecessary re-renders
  const filters = useMemo(() => ({
    search: debouncedSearch,
    status: status || undefined,
    nodeId: nodeId || undefined,
  }), [debouncedSearch, status, nodeId]);

  // Notify parent of filter changes
  useEffect(() => {
    onFiltersChange(filters);
  }, [filters, onFiltersChange]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatus(e.target.value);
  };

  const handleNodeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setNodeId(e.target.value);
  };

  const clearFilters = () => {
    setSearch('');
    setStatus('');
    setNodeId('');
  };

  const hasActiveFilters = search || status || nodeId;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search Input */}
      <div className="relative">
        <Input
          placeholder={placeholder}
          value={search}
          onChange={handleSearchChange}
          className="w-full"
          leftIcon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          }
        />
      </div>

      {/* Filters Row */}
      <div className="flex flex-col gap-3 sm:flex-row">
        {/* Status Filter */}
        {showStatusFilter && (
          <div className="flex-1 min-w-0">
            <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
              Status
            </label>
            <select
              value={status}
              onChange={handleStatusChange}
              className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Statuses</option>
              {availableStatuses.map((statusOption) => (
                <option key={statusOption} value={statusOption}>
                  {statusOption.charAt(0).toUpperCase() + statusOption.slice(1)}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Node Filter */}
        {showNodeFilter && (
          <div className="flex-1 min-w-0">
            <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
              Node
            </label>
            <select
              value={nodeId}
              onChange={handleNodeChange}
              className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Nodes</option>
              {nodes.map((node) => (
                <option key={node.id} value={node.id}>
                  {node.name} ({node.status})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="px-3 py-2 text-sm font-medium text-gray-600 transition-colors duration-200 border border-gray-300 rounded-md dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Active filters:</span>
          {search && (
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-800 bg-blue-100 rounded-full dark:bg-blue-900 dark:text-blue-200">
              Search: "{search}"
            </span>
          )}
          {status && (
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full dark:bg-green-900 dark:text-green-200">
              Status: {status}
            </span>
          )}
          {nodeId && (
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-purple-800 bg-purple-100 rounded-full dark:bg-purple-900 dark:text-purple-200">
              Node: {nodes.find(n => n.id === nodeId)?.name || nodeId}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchAndFilters;