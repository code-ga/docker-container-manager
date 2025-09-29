import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Input } from '../ui/Input';
import { RoleBadge } from './RoleBadge';
import { apiEndpoints } from '../../lib/api';
import type { User, CreateUserData, UpdateUserData } from '../../hooks/useUsers';

interface Role {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserFormProps {
  user?: User | null; // If provided, it's edit mode; if null, it's create mode
  onSave: (data: CreateUserData | UpdateUserData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

interface Role {
  id: string;
  name: string;
  description?: string;
}

interface FormData {
  name: string;
  email: string;
  password: string;
  roles: string[];
}

export const UserForm: React.FC<UserFormProps> = ({
  user,
  onSave,
  onCancel,
  isLoading = false,
}) => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isRolesLoading, setIsRolesLoading] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<string[]>(
    user?.roleIds || []
  );

  const isEdit = !!user;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<FormData>({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      password: '',
      roles: selectedRoles,
    },
  });

  // Fetch roles on component mount
  useEffect(() => {
    const fetchRoles = async () => {
      setIsRolesLoading(true);
      try {
        const response = await apiEndpoints.roles.list();
        if (response.success && response.data) {
          setRoles((response.data as any).roles);
        }
      } catch (error) {
        console.error('Failed to fetch roles:', error);
      } finally {
        setIsRolesLoading(false);
      }
    };

    fetchRoles();
  }, []);

  // Update selectedRoles when user changes (for edit mode)
  useEffect(() => {
    if (user) {
      setSelectedRoles(user.roleIds || []);
      setValue('roles', user.roleIds || []);
    }
  }, [user, setValue]);

  const handleRoleToggle = (roleId: string) => {
    const newSelectedRoles = selectedRoles.includes(roleId)
      ? selectedRoles.filter(id => id !== roleId)
      : [...selectedRoles, roleId];

    setSelectedRoles(newSelectedRoles);
    setValue('roles', newSelectedRoles);
  };

  const onSubmit = async (data: FormData) => {
    try {
      if (isEdit) {
        // Edit mode - don't include password
        const updateData: UpdateUserData = {
          name: data.name,
          email: data.email,
          roles: data.roles,
        };
        await onSave(updateData);
      } else {
        // Create mode - include password
        const createData: CreateUserData = {
          name: data.name,
          email: data.email,
          password: data.password,
          roles: data.roles,
        };
        await onSave(createData);
      }
    } catch (error) {
      console.error('Failed to save user:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Name Field */}
      <Input
        label="Name"
        placeholder="Enter user name"
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

      {/* Email Field */}
      <Input
        label="Email"
        type="email"
        placeholder="Enter email address"
        fullWidth
        {...register('email', {
          required: 'Email is required',
          pattern: {
            value: /^\S+@\S+$/i,
            message: 'Invalid email address',
          },
        })}
        error={errors.email?.message}
      />

      {/* Password Field - Only show in create mode */}
      {!isEdit && (
        <Input
          label="Password"
          type="password"
          placeholder="Enter password"
          fullWidth
          {...register('password', {
            required: 'Password is required',
            minLength: {
              value: 8,
              message: 'Password must be at least 8 characters',
            },
          })}
          error={errors.password?.message}
        />
      )}

      {/* Roles Selection */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Roles
        </label>

        {isRolesLoading ? (
          <div className="flex items-center justify-center py-4">
            <div className="w-6 h-6 border-2 border-blue-500 rounded-full border-t-transparent animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 p-2 overflow-y-auto border border-gray-200 rounded-md max-h-32 dark:border-gray-700">
            {roles.map((role) => (
              <button
                key={role.id}
                type="button"
                onClick={() => handleRoleToggle(role.id)}
                className={`p-2 text-left rounded-md transition-colors ${
                  selectedRoles.includes(role.id)
                    ? 'bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700'
                    : 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {role.name}
                  </span>
                  <RoleBadge role={role.name} />
                </div>
                {role.description && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {role.description}
                  </p>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Selected roles display */}
        {selectedRoles.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Selected:</span>
            {selectedRoles.map((roleId) => {
              const role = roles.find(r => r.id === roleId);
              return role ? (
                <RoleBadge key={roleId} role={role.name} />
              ) : null;
            })}
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
            {isEdit ? 'Update User' : 'Create User'}
          </span>
        </button>
      </div>
    </form>
  );
};