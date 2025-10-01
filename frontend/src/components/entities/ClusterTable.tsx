import React from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Edit, Trash2, Eye } from 'lucide-react';
import { DataTable } from '../data/DataTable';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { SearchAndFilters } from '../data/SearchAndFilters';
import { usePermissions } from '../../hooks/usePermissions';
import { useClusters } from '../../hooks/useClusters';
import type { Cluster } from '../../hooks/useEntities';

export interface ClusterTableProps {
  onEdit?: (cluster: Cluster) => void;
  onDelete?: (clusterId: string) => void;
  onView?: (cluster: Cluster) => void;
  className?: string;
}

export const ClusterTable: React.FC<ClusterTableProps> = ({
  onEdit,
  onDelete,
  onView,
  className,
}) => {
  const { hasPermission } = usePermissions();
  const [searchTerm, setSearchTerm] = React.useState('');
  const {
    data,
    isLoading,
  } = useClusters({
    page: 1,
    limit: 10,
    search: searchTerm,
  });

  const clusters = data?.clusters || [];


  const getStatusColor = (status: Cluster['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200';
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200';
    }
  };

  const getStatusLabel = (status: Cluster['status']) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'inactive':
        return 'Inactive';
      case 'degraded':
        return 'Degraded';
      default:
        return 'Unknown';
    }
  };


  const columns: ColumnDef<Cluster>[] = [
    {
      accessorKey: 'id',
      header: 'ID',
      cell: ({ getValue }) => (
        <div className="font-mono text-xs text-gray-500">
          {(getValue() as string).slice(0, 8)}...
        </div>
      ),
    },
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ getValue }) => (
        <div className="font-medium text-gray-900 dark:text-white">
          {getValue() as string}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue }) => (
        <Badge className={getStatusColor(getValue() as Cluster['status'])}>
          {getStatusLabel(getValue() as Cluster['status'])}
        </Badge>
      ),
    },
    {
      accessorKey: 'nodes',
      header: 'Nodes',
      cell: ({ row }) => {
        const cluster = row.original;
        return (
          <div className="text-sm text-gray-600 dark:text-gray-300">
            {cluster.nodes?.length || 0} nodes
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const cluster = row.original;
        return (
          <div className="flex items-center space-x-2">
            {hasPermission('cluster:read') && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onView?.(cluster)}
                leftIcon={<Eye className="w-4 h-4" />}
                aria-label={`View cluster ${cluster.name}`}
              >
                View
              </Button>
            )}
            {hasPermission('cluster:manage') && (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onEdit?.(cluster)}
                  leftIcon={<Edit className="w-4 h-4" />}
                  aria-label={`Edit cluster ${cluster.name}`}
                >
                  Edit
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => onDelete?.(cluster.id)}
                  leftIcon={<Trash2 className="w-4 h-4" />}
                  aria-label={`Delete cluster ${cluster.name}`}
                >
                  Delete
                </Button>
              </>
            )}
          </div>
        );
      },
    },
  ];


  return (
    <div className={className}>
      <SearchAndFilters
        onFiltersChange={(filters) => setSearchTerm(filters.search)}
        showStatusFilter={false}
        showNodeFilter={false}
        placeholder="Search clusters by name..."
        className="mb-6"
      />

      <DataTable
        data={clusters}
        columns={columns}
        searchPlaceholder="Search clusters by name..."
        isLoading={isLoading}
        className="w-full"
      />
    </div>
  );
};