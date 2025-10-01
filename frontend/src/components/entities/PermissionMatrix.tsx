import React from 'react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { usePermissions } from '../../hooks/usePermissions';
import { useRoles } from '../../hooks/useRoles';
import { useUpdateRolePermissions } from '../../hooks/useRoles';
import { toastManager } from '../../lib/toast';
import type { Role } from '../../hooks/useRoles';

// Permission categories based on backend seed data
const PERMISSION_CATEGORIES = {
  user: {
    name: 'User Management',
    permissions: [
      { value: 'user:*', label: 'All User Permissions' },
      { value: 'user:read', label: 'Read Users' },
      { value: 'user:write', label: 'Create Users' },
      { value: 'user:update', label: 'Update Users' },
      { value: 'user:delete', label: 'Delete Users' },
    ],
  },
  role: {
    name: 'Role Management',
    permissions: [
      { value: 'role:*', label: 'All Role Permissions' },
      { value: 'role:read', label: 'Read Roles' },
      { value: 'role:write', label: 'Create Roles' },
      { value: 'role:update', label: 'Update Roles' },
      { value: 'role:delete', label: 'Delete Roles' },
    ],
  },
  container: {
    name: 'Container Management',
    permissions: [
      { value: 'container:*', label: 'All Container Permissions' },
      { value: 'container:own:*', label: 'All Own Container Permissions' },
      { value: 'container:own:create', label: 'Create Own Containers' },
      { value: 'container:own:start', label: 'Start Own Containers' },
      { value: 'container:own:stop', label: 'Stop Own Containers' },
      { value: 'container:own:restart', label: 'Restart Own Containers' },
      { value: 'container:own:delete', label: 'Delete Own Containers' },
      { value: 'container:own:logs', label: 'View Own Container Logs' },
      { value: 'container:manage', label: 'Manage All Containers' },
    ],
  },
  node: {
    name: 'Node Management',
    permissions: [
      { value: 'node:*', label: 'All Node Permissions' },
      { value: 'node:read', label: 'Read Nodes' },
      { value: 'node:manage', label: 'Manage Nodes' },
    ],
  },
  cluster: {
    name: 'Cluster Management',
    permissions: [
      { value: 'cluster:*', label: 'All Cluster Permissions' },
      { value: 'cluster:read', label: 'Read Clusters' },
      { value: 'cluster:manage', label: 'Manage Clusters' },
    ],
  },
  egg: {
    name: 'Egg Management',
    permissions: [
      { value: 'egg:*', label: 'All Egg Permissions' },
      { value: 'egg:read', label: 'Read Eggs' },
      { value: 'egg:manage', label: 'Manage Eggs' },
    ],
  },
  permission: {
    name: 'Permission Management',
    permissions: [
      { value: 'permission:*', label: 'All Permission Permissions' },
      { value: 'permission:read', label: 'Read Permissions' },
      { value: 'permission:create', label: 'Create Permissions' },
      { value: 'permission:update', label: 'Update Permissions' },
      { value: 'permission:delete', label: 'Delete Permissions' },
    ],
  },
  migration: {
    name: 'Migration Management',
    permissions: [
      { value: 'migration:*', label: 'All Migration Permissions' },
      { value: 'migration:manage', label: 'Manage Migrations' },
    ],
  },
};

export interface PermissionMatrixProps {
  roles: Role[];
  className?: string;
}

export const PermissionMatrix: React.FC<PermissionMatrixProps> = ({
  roles,
  className,
}) => {
  const { hasPermission } = usePermissions();
  const { data: rolesData } = useRoles();
  const allRoles = rolesData?.roles || [];
  const updateRolePermissions = useUpdateRolePermissions();

  const handlePermissionToggle = async (roleId: string, permission: string, needHasPermission: boolean) => {
    if (!hasPermission('permission:update')) {
      toastManager.showError('You do not have permission to update role permissions');
      return;
    }

    try {
      const role = allRoles.find(r => r.id === roleId);
      if (!role) return;

      const currentPermissions = role.permissions || [];
      const updatedPermissions = needHasPermission
        ? currentPermissions.filter((p) => p !== permission)
        : [...currentPermissions, permission];

      await updateRolePermissions.mutateAsync({
        id: roleId,
        data: {
          permissions: updatedPermissions,
        },
      });

      toastManager.showSuccess('Role permissions updated successfully');
    } catch (error) {
      console.error('Failed to update role permissions:', error);
      // Error toast is handled by the mutation
    }
  };

  const getRolePermissionStatus = (role: Role, permission: string): boolean => {
    return (role.permissions || []).includes(permission);
  };

  if (!hasPermission('permission:read')) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">
          You don't have permission to view the permission matrix.
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Permission Matrix
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Manage role permissions across different categories
        </p>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-full">
          {/* Header Row */}
          <div className="grid gap-4 mb-4" style={{ gridTemplateColumns: `200px repeat(${roles.length}, 120px) 100px` }}>
            <div className="font-medium text-gray-900 dark:text-white">
              Permission
            </div>
            {roles.map((role) => (
              <div key={role.id} className="text-center">
                <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
                  {role.name}
                </Badge>
              </div>
            ))}
            <div className="font-medium text-gray-900 dark:text-white text-center">
              Actions
            </div>
          </div>

          {/* Permission Rows */}
          <div className="space-y-2">
            {Object.entries(PERMISSION_CATEGORIES).map(([categoryKey, category]) => (
              <div key={categoryKey} className="space-y-2">
                {/* Category Header */}
                <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2 rounded-lg">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {category.name}
                  </h3>
                </div>

                {/* Category Permissions */}
                <div className="ml-4 space-y-1">
                  {category.permissions.map((permission) => (
                    <div
                      key={permission.value}
                      className="grid gap-4 items-center"
                      style={{ gridTemplateColumns: `200px repeat(${roles.length}, 120px) 100px` }}
                    >
                      <div className="text-sm">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {permission.label}
                        </div>
                        <div className="font-mono text-xs text-gray-500 dark:text-gray-400">
                          {permission.value}
                        </div>
                      </div>

                      {roles.map((role) => {
                        const hasThisPermission = getRolePermissionStatus(role, permission.value);
                        return (
                          <div key={role.id} className="flex justify-center">
                            <input
                              type="checkbox"
                              checked={hasThisPermission}
                              onChange={() => handlePermissionToggle(role.id, permission.value, hasThisPermission)}
                              disabled={updateRolePermissions.isPending || !hasPermission('permission:update')}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                            />
                          </div>
                        );
                      })}

                      <div className="flex justify-center">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            // Select all roles for this permission
                            roles.forEach(role => {
                              if (!getRolePermissionStatus(role, permission.value)) {
                                handlePermissionToggle(role.id, permission.value, false);
                              }
                            });
                          }}
                          disabled={!hasPermission('permission:update')}
                          className="text-xs"
                        >
                          All
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h3 className="font-medium text-gray-900 dark:text-white mb-2">
          Summary
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          {roles.map((role) => (
            <div key={role.id}>
              <span className="font-medium text-gray-900 dark:text-white">
                {role.name}:
              </span>
              <span className="ml-2 text-gray-600 dark:text-gray-400">
                {(role.permissions || []).length} permissions
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};