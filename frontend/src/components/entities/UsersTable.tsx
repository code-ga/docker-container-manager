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
  selectedUsers?: string[];
  onSelectionChange?: (userIds: string[]) => void;
}

export const UsersTable: React.FC<UsersTableProps> = ({
  users,
  onEdit,
  onDelete,
  isLoading = false,
  selectedUsers = [],
  onSelectionChange,
}) => {
  const columns: ColumnDef<User>[] = [
    ...(onSelectionChange ? [{
      id: 'select',
      header: ({ table }: { table: any }) => (
        <input
          type="checkbox"
          checked={table.getIsAllPageRowsSelected()}
          onChange={(e) => {
            table.toggleAllPageRowsSelected(e.target.checked);
            if (onSelectionChange) {
              const selectedIds = e.target.checked
                ? users.map(user => user.id)
                : [];
              onSelectionChange(selectedIds);
            }
          }}
          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
        />
      ),
      cell: ({ row }: { row: any }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={(e) => {
            row.toggleSelected(e.target.checked);
            if (onSelectionChange) {
              const currentlySelected = users
                .filter(user => selectedUsers.includes(user.id) ||
                         (e.target.checked && user.id === row.original.id))
                .map(user => user.id);
              onSelectionChange(currentlySelected);
            }
          }}
          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
        />
      ),
    }] : []),
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