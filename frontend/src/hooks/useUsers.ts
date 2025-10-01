import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiEndpoints, handleApiError } from '../lib/api';
import { toastManager } from '../lib/toast';
import { usePermissions } from './usePermissions';

// User type definition - matches backend schema
export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  postIds: string[];
  roleIds: string[];
  createdAt: string;
  updatedAt: string;
}

// API response types
interface UsersListResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface ValidationResponse {
  type: string;
  on: string;
  found: {
    status: number;
    message: string;
    success: boolean;
    data: UsersListResponse;
  };
}


export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  roles: string[];
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  roles?: string[];
}

export interface BulkUpdateRolesData {
  userIds: string[];
  roleId: string;
}

// Query keys factory
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (search?: string) => [...userKeys.lists(), search] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
};

// Hook for fetching users with search
export const useUsers = (search?: string, enabled = true) => {
  const { hasPermission } = usePermissions();

  return useQuery({
    queryKey: userKeys.list(search),
    queryFn: async () => {
      // Check permissions
      if (!hasPermission('users:read')) {
        throw new Error('Insufficient permissions to read users');
      }

      const response = await apiEndpoints.users.list();

      // Handle validation wrapper structure from backend
      if (
        (response.data as ValidationResponse).type === "validation" &&
        (response.data as ValidationResponse).found?.success
      ) {
        const { users: usersData, pagination: paginationData } = (
          response.data as ValidationResponse
        ).found.data;

        // Filter users based on search if provided
        let filteredUsers = usersData;
        if (search) {
          const searchLower = search.toLowerCase();
          filteredUsers = usersData.filter(
            (user) =>
              user.name.toLowerCase().includes(searchLower) ||
              user.email.toLowerCase().includes(searchLower)
          );
        }

        return {
          users: filteredUsers,
          pagination: paginationData,
        };
      } else if (response.success && response.data) {
        // Handle direct response structure (fallback)
        let usersData = (response.data as UsersListResponse).users;

        // Filter users based on search if provided
        if (search) {
          const searchLower = search.toLowerCase();
          usersData = usersData.filter(
            (user) =>
              user.name.toLowerCase().includes(searchLower) ||
              user.email.toLowerCase().includes(searchLower)
          );
        }

        return {
          users: usersData,
          pagination: (response.data as UsersListResponse).pagination || null,
        };
      } else {
        throw new Error("Failed to fetch users");
      }
    },
    enabled: enabled && hasPermission('users:read'),
    staleTime: 30000, // 30 seconds
    retry: 3,
  });
};

// Hook for fetching a single user
export const useUser = (id: string, enabled = true) => {
  const { hasPermission } = usePermissions();

  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: async () => {
      // Check permissions
      if (!hasPermission('users:read')) {
        throw new Error('Insufficient permissions to read users');
      }

      const response = await apiEndpoints.users.get(id);
      return response.data;
    },
    enabled: enabled && !!id && hasPermission('users:read'),
    staleTime: 30000,
    retry: 3,
  });
};

// Mutation hook for creating users
export const useCreateUser = () => {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();

  return useMutation({
    mutationFn: async (data: CreateUserData) => {
      // Check permissions
      if (!hasPermission('users:create')) {
        throw new Error('Insufficient permissions to create users');
      }

      const response = await apiEndpoints.users.create({
        name: data.name,
        email: data.email,
        password: data.password,
        roleId: data.roles.length > 0 ? data.roles[0] : undefined, // Backend expects single roleId
      });
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch users list
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      toastManager.showSuccess('User created successfully');
    },
    onError: (error) => {
      const errorMessage = handleApiError(error);
      toastManager.showError('Failed to create user', errorMessage);
    },
  });
};

// Mutation hook for updating users
export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateUserData }) => {
      // Check permissions
      if (!hasPermission('users:update')) {
        throw new Error('Insufficient permissions to update users');
      }

      const response = await apiEndpoints.users.update(id, {
        name: data.name,
        email: data.email,
        roleId:
          data.roles && data.roles.length > 0
            ? data.roles[0]
            : undefined,
      });
      return response.data;
    },
    onSuccess: (_data, variables) => {
      // Invalidate specific user and users list
      queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      toastManager.showSuccess('User updated successfully');
    },
    onError: (error) => {
      const errorMessage = handleApiError(error);
      toastManager.showError('Failed to update user', errorMessage);
    },
  });
};

// Mutation hook for deleting users
export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();

  return useMutation({
    mutationFn: async (id: string) => {
      // Check permissions
      if (!hasPermission('users:delete')) {
        throw new Error('Insufficient permissions to delete users');
      }

      const response = await apiEndpoints.users.delete(id);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      // Remove user from cache and invalidate lists
      queryClient.removeQueries({ queryKey: userKeys.detail(variables) });
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      toastManager.showSuccess('User deleted successfully');
    },
    onError: (error) => {
      const errorMessage = handleApiError(error);
      toastManager.showError('Failed to delete user', errorMessage);
    },
  });
};

// Mutation hook for bulk updating user roles
export const useBulkUpdateRoles = () => {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();

  return useMutation({
    mutationFn: async (data: BulkUpdateRolesData) => {
      // Check permissions
      if (!hasPermission('users:manage')) {
        throw new Error('Insufficient permissions to manage user roles');
      }

      const response = await apiEndpoints.users.bulkRoles(data);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      // Invalidate all user queries since multiple users may have been updated
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      toastManager.showSuccess(`Roles assigned to ${variables.userIds.length} users successfully`);
    },
    onError: (error) => {
      const errorMessage = handleApiError(error);
      toastManager.showError('Failed to update user roles', errorMessage);
    },
  });
};

// Legacy hook for backward compatibility (uses the new React Query hooks internally)
export const useUsersLegacy = () => {
  const { data, isLoading, error, refetch } = useUsers();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const bulkUpdateRoles = useBulkUpdateRoles();

  return {
    users: data?.users || [],
    isLoading,
    error: error?.message || null,
    pagination: data?.pagination || null,
    fetchUsers: refetch,
    createUser: createUser.mutateAsync,
    updateUser: updateUser.mutateAsync,
    deleteUser: deleteUser.mutateAsync,
    bulkUpdateRoles: bulkUpdateRoles.mutateAsync,
    refetch,
  };
};
