import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiEndpoints, handleApiError } from '../lib/api';
import { toastManager } from '../lib/toast';

// Types
export interface Container {
  id: string;
  name: string;
  status: string;
  nodeId: string;
  eggId: string;
  environment: Record<string, string>;
  ports: Array<{ host: number; container: number }>;
  volumes: Array<{ host: string; container: string }>;
  resources: {
    cpu?: number;
    memory?: string;
    disk?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ContainerStats {
  cpu: number;
  memory: {
    usage: string;
    limit: string;
    percentage: number;
  };
  network: {
    rx: string;
    tx: string;
  };
  disk: {
    read: string;
    write: string;
  };
}

export interface CreateContainerData {
  name: string;
  eggId: string;
  nodeId: string;
  environment?: Record<string, string>;
  ports?: Array<{ host: number; container: number }>;
  volumes?: Array<{ host: string; container: string }>;
  resources?: {
    cpu?: number;
    memory?: string;
    disk?: string;
  };
}

export interface UpdateContainerData {
  name?: string;
  environment?: Record<string, string>;
  ports?: Array<{ host: number; container: number }>;
  volumes?: Array<{ host: string; container: string }>;
  resources?: {
    cpu?: number;
    memory?: string;
    disk?: string;
  };
}

export interface ContainerFilters {
  status?: string;
  nodeId?: string;
}

// Query keys factory
export const containerKeys = {
  all: ['containers'] as const,
  lists: () => [...containerKeys.all, 'list'] as const,
  list: (filters?: ContainerFilters) => [...containerKeys.lists(), filters] as const,
  details: () => [...containerKeys.all, 'detail'] as const,
  detail: (id: string) => [...containerKeys.details(), id] as const,
  stats: (id: string) => [...containerKeys.all, 'stats', id] as const,
  logs: (id: string, lines?: number) => [...containerKeys.all, 'logs', id, lines] as const,
};

// Hook for fetching containers with filters
export const useContainers = (filters?: ContainerFilters, enabled = true) => {
  return useQuery({
    queryKey: containerKeys.list(filters),
    queryFn: async () => {
      const response = await apiEndpoints.containers.list(filters);
      return response.data;
    },
    enabled,
    staleTime: 30000, // 30 seconds
    retry: 3,
  });
};

// Hook for fetching a single container
export const useContainer = (id: string, enabled = true) => {
  return useQuery({
    queryKey: containerKeys.detail(id),
    queryFn: async () => {
      const response = await apiEndpoints.containers.get(id);
      return response.data;
    },
    enabled: enabled && !!id,
    staleTime: 30000,
    retry: 3,
  });
};

// Hook for fetching container stats
export const useContainerStats = (id: string, enabled = true) => {
  return useQuery({
    queryKey: containerKeys.stats(id),
    queryFn: async () => {
      const response = await apiEndpoints.containers.stats(id);
      return response.data;
    },
    enabled: enabled && !!id,
    staleTime: 10000, // 10 seconds for stats
    retry: 3,
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });
};

// Hook for fetching container logs
export const useContainerLogs = (id: string, lines = 100, enabled = true) => {
  return useQuery({
    queryKey: containerKeys.logs(id, lines),
    queryFn: async () => {
      const response = await apiEndpoints.containers.logs(id, lines);
      return response.data;
    },
    enabled: enabled && !!id,
    staleTime: 5000, // 5 seconds for logs
    retry: 2,
  });
};

// Mutation hook for creating containers
export const useCreateContainer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateContainerData) => {
      const response = await apiEndpoints.containers.create(data);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch containers list
      queryClient.invalidateQueries({ queryKey: containerKeys.lists() });
      toastManager.showSuccess('Container created successfully');
    },
    onError: (error) => {
      const errorMessage = handleApiError(error);
      toastManager.showError('Failed to create container', errorMessage);
    },
  });
};

// Mutation hook for updating containers
export const useUpdateContainer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateContainerData }) => {
      const response = await apiEndpoints.containers.update(id, data);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      // Invalidate specific container and containers list
      queryClient.invalidateQueries({ queryKey: containerKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: containerKeys.lists() });
      toastManager.showSuccess('Container updated successfully');
    },
    onError: (error) => {
      const errorMessage = handleApiError(error);
      toastManager.showError('Failed to update container', errorMessage);
    },
  });
};

// Mutation hook for deleting containers
export const useDeleteContainer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiEndpoints.containers.delete(id);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      // Remove container from cache and invalidate lists
      queryClient.removeQueries({ queryKey: containerKeys.detail(variables) });
      queryClient.invalidateQueries({ queryKey: containerKeys.lists() });
      toastManager.showSuccess('Container deleted successfully');
    },
    onError: (error) => {
      const errorMessage = handleApiError(error);
      toastManager.showError('Failed to delete container', errorMessage);
    },
  });
};

// Mutation hook for container actions (start, stop, restart)
export const useContainerActions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      action
    }: {
      id: string;
      action: 'start' | 'stop' | 'restart'
    }) => {
      let response;
      switch (action) {
        case 'start':
          response = await apiEndpoints.containers.start(id);
          break;
        case 'stop':
          response = await apiEndpoints.containers.stop(id);
          break;
        case 'restart':
          response = await apiEndpoints.containers.restart(id);
          break;
        default:
          throw new Error(`Unknown action: ${action}`);
      }
      return response.data;
    },
    onSuccess: (_data, variables) => {
      // Invalidate container details, stats, and lists
      queryClient.invalidateQueries({ queryKey: containerKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: containerKeys.stats(variables.id) });
      queryClient.invalidateQueries({ queryKey: containerKeys.lists() });

      const actionNames = {
        start: 'started',
        stop: 'stopped',
        restart: 'restarted',
      };
      toastManager.showSuccess(
        `Container ${actionNames[variables.action]} successfully`
      );
    },
    onError: (error, variables) => {
      const errorMessage = handleApiError(error);
      const actionNames = {
        start: 'start',
        stop: 'stop',
        restart: 'restart',
      };
      toastManager.showError(
        `Failed to ${actionNames[variables.action]} container`,
        errorMessage
      );
    },
  });
};