import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiEndpoints, handleApiError } from '../lib/api';
import { toastManager } from '../lib/toast';
import { usePermissions } from './usePermissions';

// Query parameters for eggs list
export interface EggListParams {
  page?: number;
  limit?: number;
  search?: string;
}

// Create egg data
export interface CreateEggData {
  name: string;
  description?: string;
  image: string;
  environment?: Record<string, string>;
  ports?: Array<{ container: number; protocol: string }>;
  volumes?: Array<{ container: string; mount: string }>;
}

// Update egg data
export interface UpdateEggData {
  name?: string;
  description?: string;
  image?: string;
  environment?: Record<string, string>;
  ports?: Array<{ container: number; protocol: string }>;
  volumes?: Array<{ container: string; mount: string }>;
}

// Query keys factory
export const eggKeys = {
  all: ['eggs'] as const,
  lists: () => [...eggKeys.all, 'list'] as const,
  list: (params?: EggListParams) => [...eggKeys.lists(), params] as const,
  details: () => [...eggKeys.all, 'detail'] as const,
  detail: (id: string) => [...eggKeys.details(), id] as const,
};

// Hook for fetching eggs with pagination and filters
export const useEggs = (params?: EggListParams, enabled = true) => {
  const { hasPermission } = usePermissions();

  return useQuery({
    queryKey: eggKeys.list(params),
    queryFn: async () => {
      // Check permissions
      if (!hasPermission('eggs:read')) {
        throw new Error('Insufficient permissions to read eggs');
      }

      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.search) queryParams.append('search', params.search);

      const response = await apiEndpoints.eggs.list();

      // Filter results client-side for now since API doesn't support query params
      let data = response.data as import('./useEntities').Egg[];

      if (params?.search) {
        const searchLower = params.search.toLowerCase();
        data = data.filter((egg) =>
          egg.name.toLowerCase().includes(searchLower) ||
          (egg.description && egg.description.toLowerCase().includes(searchLower))
        );
      }

      // Apply pagination client-side
      const page = params?.page || 1;
      const limit = params?.limit || DEFAULT_PAGE_SIZE;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedData = data.slice(startIndex, endIndex);

      return {
        eggs: paginatedData,
        pagination: {
          page,
          limit,
          total: data.length,
          pages: Math.ceil(data.length / limit),
        },
      };
    },
    enabled: enabled && hasPermission('eggs:read'),
    staleTime: 300000, // 5 minutes - eggs don't change often
    retry: 3,
  });
};

// Hook for fetching a single egg
export const useEgg = (id: string, enabled = true) => {
  const { hasPermission } = usePermissions();

  return useQuery({
    queryKey: eggKeys.detail(id),
    queryFn: async () => {
      // Check permissions
      if (!hasPermission('eggs:read')) {
        throw new Error('Insufficient permissions to read eggs');
      }

      const response = await apiEndpoints.eggs.get(id);
      return response.data;
    },
    enabled: enabled && !!id && hasPermission('eggs:read'),
    staleTime: 300000, // 5 minutes
    retry: 3,
  });
};

// Mutation hook for creating eggs
export const useCreateEgg = () => {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();

  return useMutation({
    mutationFn: async (data: CreateEggData) => {
      // Check permissions
      if (!hasPermission('eggs:create')) {
        throw new Error('Insufficient permissions to create eggs');
      }

      const response = await apiEndpoints.eggs.create(data);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch eggs list
      queryClient.invalidateQueries({ queryKey: eggKeys.lists() });
      toastManager.showSuccess('Egg created successfully');
    },
    onError: (error) => {
      const errorMessage = handleApiError(error);
      toastManager.showError('Failed to create egg', errorMessage);
    },
  });
};

// Mutation hook for updating eggs
export const useUpdateEgg = () => {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateEggData }) => {
      // Check permissions
      if (!hasPermission('eggs:update')) {
        throw new Error('Insufficient permissions to update eggs');
      }

      const response = await apiEndpoints.eggs.update(id, data);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      // Invalidate specific egg and eggs list
      queryClient.invalidateQueries({ queryKey: eggKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: eggKeys.lists() });
      toastManager.showSuccess('Egg updated successfully');
    },
    onError: (error) => {
      const errorMessage = handleApiError(error);
      toastManager.showError('Failed to update egg', errorMessage);
    },
  });
};

// Mutation hook for deleting eggs
export const useDeleteEgg = () => {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();

  return useMutation({
    mutationFn: async (id: string) => {
      // Check permissions
      if (!hasPermission('eggs:delete')) {
        throw new Error('Insufficient permissions to delete eggs');
      }

      const response = await apiEndpoints.eggs.delete(id);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      // Remove egg from cache and invalidate lists
      queryClient.removeQueries({ queryKey: eggKeys.detail(variables) });
      queryClient.invalidateQueries({ queryKey: eggKeys.lists() });
      toastManager.showSuccess('Egg deleted successfully');
    },
    onError: (error) => {
      const errorMessage = handleApiError(error);
      toastManager.showError('Failed to delete egg', errorMessage);
    },
  });
};

// Default pagination settings
export const DEFAULT_PAGE_SIZE = 10;