import React from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Edit, Trash2 } from 'lucide-react';
import { DataTable } from '../data/DataTable';
import { Button } from '../ui/Button';
import { RoleBadge } from './RoleBadge';
import type { User } from '../../hooks/useUsers';

export interface UsersTableProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
}

export const UsersTable: React.FC<UsersTableProps> = ({
  users,
  onEdit,
  onDelete,
  isLoading = false,
}) => {
  const columns: ColumnDef<User>[] = [
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
      accessorKey: 'email',
      header: 'Email',
      cell: ({ getValue }) => (
        <div className="text-gray-600 dark:text-gray-300">
          {getValue() as string}
        </div>
      ),
    },
    {
      accessorKey: 'roleIds',
      header: 'Roles',
      cell: ({ row }) => {
        const roleIds = row.original.roleIds || [];
        return (
          <div className="flex flex-wrap gap-1">
            {roleIds.length > 0 ? (
              roleIds.map((roleId) => (
                <RoleBadge key={roleId} role={roleId} />
              ))
            ) : (
              <span className="text-sm text-gray-400">No roles assigned</span>
            )}
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex items-center space-x-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onEdit(user)}
              leftIcon={<Edit className="w-4 h-4" />}
            >
              Edit
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => onDelete(user.id)}
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
      data={users}
      columns={columns}
      searchPlaceholder="Search users by name or email..."
      isLoading={isLoading}
      className="w-full"
    />
  );
};