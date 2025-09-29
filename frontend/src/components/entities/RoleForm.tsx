import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Input } from '../ui/Input';
import type { Role, CreateRoleData, UpdateRoleData } from '../../hooks/useRoles';

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

export interface RoleFormProps {
  role?: Role | null; // If provided, it's edit mode; if null, it's create mode
  onSave: (data: CreateRoleData | UpdateRoleData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

interface FormData {
  name: string;
  description: string;
  permissions: string[];
}

export const RoleForm: React.FC<RoleFormProps> = ({
  role,
  onSave,
  onCancel,
  isLoading = false,
}) => {
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(
    role?.permissions || []
  );

  const isEdit = !!role;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<FormData>({
    defaultValues: {
      name: role?.name || '',
      description: role?.description || '',
      permissions: selectedPermissions,
    },
  });

  // Update selectedPermissions when role changes (for edit mode)
  useEffect(() => {
    if (role) {
      const rolePermissions = role.permissions || [];
      setSelectedPermissions(rolePermissions);
      setValue('permissions', rolePermissions);
    }
  }, [role, setValue]);

  const handlePermissionToggle = (permission: string) => {
    const newSelectedPermissions = selectedPermissions.includes(permission)
      ? selectedPermissions.filter(p => p !== permission)
      : [...selectedPermissions, permission];

    setSelectedPermissions(newSelectedPermissions);
    setValue('permissions', newSelectedPermissions);
  };

  const onSubmit = async (data: FormData) => {
    try {
      if (isEdit) {
        const updateData: UpdateRoleData = {
          name: data.name,
          description: data.description,
          permissions: data.permissions,
        };
        await onSave(updateData);
      } else {
        const createData: CreateRoleData = {
          name: data.name,
          description: data.description,
          permissions: data.permissions,
        };
        await onSave(createData);
      }
    } catch (error) {
      console.error('Failed to save role:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Name Field */}
      <Input
        label="Name"
        placeholder="Enter role name"
        fullWidth
        {...register('name', {
          required: 'Name is required',
          minLength: {
            value: 1,
            message: 'Name cannot be empty',
          },
        })}
        error={errors.name?.message}
      />

      {/* Description Field */}
      <Input
        label="Description"
        placeholder="Enter role description (optional)"
        fullWidth
        {...register('description')}
        error={errors.description?.message}
      />

      {/* Permissions Selection */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Permissions
        </label>

        <div className="space-y-4 overflow-y-auto max-h-96">
          {Object.entries(PERMISSION_CATEGORIES).map(([categoryKey, category]) => (
            <fieldset key={categoryKey} className="p-4 border border-gray-200 rounded-lg dark:border-gray-700">
              <legend className="px-2 text-sm font-semibold text-gray-900 dark:text-white">
                {category.name}
              </legend>

              <div className="grid grid-cols-1 gap-2 mt-3">
                {category.permissions.map((permission) => (
                  <label
                    key={permission.value}
                    className="flex items-center p-2 space-x-3 rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <input
                      type="checkbox"
                      checked={selectedPermissions.includes(permission.value)}
                      onChange={() => handlePermissionToggle(permission.value)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {permission.label}
                      </div>
                      <div className="font-mono text-xs text-gray-500 dark:text-gray-400">
                        {permission.value}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
        </div>

        {/* Selected permissions summary */}
        {selectedPermissions.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">
              Selected Permissions ({selectedPermissions.length}):
            </p>
            <div className="flex flex-wrap gap-1">
              {selectedPermissions.map((permission) => (
                <span
                  key={permission}
                  className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-800 bg-blue-100 rounded-full dark:bg-blue-900/30 dark:text-blue-200"
                >
                  {permission}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end pt-4 space-x-3 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2 text-base font-medium text-gray-700 transition-all duration-200 bg-gray-600 border border-transparent rounded-lg hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="relative inline-flex items-center justify-center px-4 py-2 text-base font-medium text-black transition-all duration-200 bg-blue-600 border border-transparent rounded-lg hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-current rounded-full border-t-transparent animate-spin" />
            </div>
          )}
          <span className={isLoading ? "invisible" : ""}>
            {isEdit ? 'Update Role' : 'Create Role'}
          </span>
        </button>
      </div>
    </form>
  );
};
