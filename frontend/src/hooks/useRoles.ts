import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiEndpoints, handleApiError } from '../lib/api';
import { toastManager } from '../lib/toast';
import { usePermissions } from './usePermissions';

// Role type definition
export interface Role {
  id: string;
  name: string;
  description: string;
  permissions?: string[];
  createdAt: string;
  updatedAt: string;
}

// API response types
interface RolesListResponse {
  roles: Role[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}


export interface CreateRoleData {
  name: string;
  description?: string;
  permissions: string[];
}

export interface UpdateRoleData {
  name?: string;
  description?: string;
  permissions?: string[];
}

export interface UpdateRolePermissionsData {
  permissions: string[];
}

// Query keys factory
export const roleKeys = {
  all: ['roles'] as const,
  lists: () => [...roleKeys.all, 'list'] as const,
  list: (search?: string) => [...roleKeys.lists(), search] as const,
  details: () => [...roleKeys.all, 'detail'] as const,
  detail: (id: string) => [...roleKeys.details(), id] as const,
  withPermissions: () => [...roleKeys.all, 'with-permissions'] as const,
};

// Hook for fetching roles with search
export const useRoles = (search?: string, enabled = true) => {
  const { hasPermission } = usePermissions();

  return useQuery({
    queryKey: roleKeys.list(search),
    queryFn: async () => {
      // Check permissions
      if (!hasPermission('roles:read')) {
        throw new Error('Insufficient permissions to read roles');
      }

      const response = await apiEndpoints.roles.list();

      if (response.success && response.data) {
        let rolesData = (response.data as RolesListResponse).roles;

        // Filter roles based on search if provided
        if (search) {
          const searchLower = search.toLowerCase();
          rolesData = rolesData.filter(role =>
            role.name.toLowerCase().includes(searchLower) ||
            (role.description && role.description.toLowerCase().includes(searchLower))
          );
        }

        return {
          roles: rolesData,
          pagination: (response.data as RolesListResponse).pagination || null,
        };
      } else {
        throw new Error('Failed to fetch roles');
      }
    },
    enabled: enabled && hasPermission('roles:read'),
    staleTime: 30000, // 30 seconds
    retry: 3,
  });
};

// Hook for fetching roles with permissions
export const useRolesWithPermissions = (enabled = true) => {
  const { hasPermission } = usePermissions();

  return useQuery({
    queryKey: roleKeys.withPermissions(),
    queryFn: async () => {
      // Check permissions
      if (!hasPermission('roles:read')) {
        throw new Error('Insufficient permissions to read roles');
      }

      const response = await apiEndpoints.roles.listWithPermissions();
      return response.data;
    },
    enabled: enabled && hasPermission('roles:read'),
    staleTime: 30000,
    retry: 3,
  });
};

// Hook for fetching a single role
export const useRole = (id: string, enabled = true) => {
  const { hasPermission } = usePermissions();

  return useQuery({
    queryKey: roleKeys.detail(id),
    queryFn: async () => {
      // Check permissions
      if (!hasPermission('roles:read')) {
        throw new Error('Insufficient permissions to read roles');
      }

      const response = await apiEndpoints.roles.get(id);
      return response.data;
    },
    enabled: enabled && !!id && hasPermission('roles:read'),
    staleTime: 30000,
    retry: 3,
  });
};

// Mutation hook for creating roles
export const useCreateRole = () => {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();

  return useMutation({
    mutationFn: async (data: CreateRoleData) => {
      // Check permissions
      if (!hasPermission('roles:create')) {
        throw new Error('Insufficient permissions to create roles');
      }

      const response = await apiEndpoints.roles.create({
        name: data.name,
        description: data.description,
        permissions: data.permissions,
      });
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch roles list
      queryClient.invalidateQueries({ queryKey: roleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: roleKeys.withPermissions() });
      toastManager.showSuccess('Role created successfully');
    },
    onError: (error) => {
      const errorMessage = handleApiError(error);
      toastManager.showError('Failed to create role', errorMessage);
    },
  });
};

// Mutation hook for updating roles
export const useUpdateRole = () => {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateRoleData }) => {
      // Check permissions
      if (!hasPermission('roles:update')) {
        throw new Error('Insufficient permissions to update roles');
      }

      const response = await apiEndpoints.roles.update(id, {
        name: data.name,
        description: data.description,
        permissions: data.permissions,
      });
      return response.data;
    },
    onSuccess: (_data, variables) => {
      // Invalidate specific role and roles lists
      queryClient.invalidateQueries({ queryKey: roleKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: roleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: roleKeys.withPermissions() });
      toastManager.showSuccess('Role updated successfully');
    },
    onError: (error) => {
      const errorMessage = handleApiError(error);
      toastManager.showError('Failed to update role', errorMessage);
    },
  });
};

// Mutation hook for updating role permissions
export const useUpdateRolePermissions = () => {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateRolePermissionsData }) => {
      // Check permissions
      if (!hasPermission('roles:manage')) {
        throw new Error('Insufficient permissions to manage role permissions');
      }

      const response = await apiEndpoints.roles.updatePermissions(id, data);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      // Invalidate specific role and all role lists since permissions affect role data
      queryClient.invalidateQueries({ queryKey: roleKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: roleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: roleKeys.withPermissions() });
      toastManager.showSuccess('Role permissions updated successfully');
    },
    onError: (error) => {
      const errorMessage = handleApiError(error);
      toastManager.showError('Failed to update role permissions', errorMessage);
    },
  });
};

// Mutation hook for deleting roles
export const useDeleteRole = () => {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();

  return useMutation({
    mutationFn: async (id: string) => {
      // Check permissions
      if (!hasPermission('roles:delete')) {
        throw new Error('Insufficient permissions to delete roles');
      }

      const response = await apiEndpoints.roles.delete(id);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      // Remove role from cache and invalidate lists
      queryClient.removeQueries({ queryKey: roleKeys.detail(variables) });
      queryClient.invalidateQueries({ queryKey: roleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: roleKeys.withPermissions() });
      toastManager.showSuccess('Role deleted successfully');
    },
    onError: (error) => {
      const errorMessage = handleApiError(error);
      toastManager.showError('Failed to delete role', errorMessage);
    },
  });
};

// Legacy hook for backward compatibility (uses the new React Query hooks internally)
export const useRolesLegacy = () => {
  const { data, isLoading, error, refetch } = useRoles();
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const deleteRole = useDeleteRole();
  const updateRolePermissions = useUpdateRolePermissions();

  return {
    roles: data?.roles || [],
    isLoading,
    error: error?.message || null,
    pagination: data?.pagination || null,
    fetchRoles: refetch,
    createRole: createRole.mutateAsync,
    updateRole: updateRole.mutateAsync,
    deleteRole: deleteRole.mutateAsync,
    updateRolePermissions: updateRolePermissions.mutateAsync,
    refetch,
  };
};