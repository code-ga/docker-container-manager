import React from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Edit, Trash2 } from 'lucide-react';
import { DataTable } from '../data/DataTable';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import type { Role } from '../../hooks/useRoles';

export interface RolesTableProps {
  roles: Role[];
  onEdit: (role: Role) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
}

export const RolesTable: React.FC<RolesTableProps> = ({
  roles,
  onEdit,
  onDelete,
  isLoading = false,
}) => {
  const columns: ColumnDef<Role>[] = [
    {
      accessorKey: 'id',
      header: 'ID',
      cell: ({ getValue }) => (
        <div className="font-mono text-xs text-gray-500 dark:text-gray-400">
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
      accessorKey: 'description',
      header: 'Description',
      cell: ({ getValue }) => (
        <div className="max-w-xs text-gray-600 truncate dark:text-gray-300">
          {getValue() as string || '-'}
        </div>
      ),
    },
    {
      accessorKey: 'permissions',
      header: 'Permissions',
      cell: ({ row }) => (
        (row.original.permissions || []).slice(0, 3).map(perm => <Badge key={perm}>{perm}</Badge>) || <span>No permissions</span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const role = row.original;
        return (
          <div className="flex items-center space-x-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onEdit(role)}
              leftIcon={<Edit className="w-4 h-4" />}
            >
              Edit
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => onDelete(role.id)}
              leftIcon={<Trash2 className="w-4 h-4" />}
            >
              Delete
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <DataTable
      data={roles}
      columns={columns}
      searchPlaceholder="Search roles by name or description..."
      isLoading={isLoading}
      className="w-full"
    />
  );
};