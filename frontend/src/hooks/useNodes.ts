import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiEndpoints, handleApiError } from '../lib/api';
import { toastManager } from '../lib/toast';
import { usePermissions } from './usePermissions';
import type { Node } from './useEntities';

// Query parameters for nodes list
export interface NodeListParams {
  page?: number;
  limit?: number;
  search?: string;
  clusterId?: string;
}

// Create node data
export interface CreateNodeData {
  name: string;
  description?: string;
  clusterId?: string;
}

// Update node data
export interface UpdateNodeData {
  name?: string;
  description?: string;
  clusterId?: string;
}

// Assign cluster data
export interface AssignClusterData {
  clusterId: string;
}

// Query keys factory
export const nodeKeys = {
  all: ['nodes'] as const,
  lists: () => [...nodeKeys.all, 'list'] as const,
  list: (params?: NodeListParams) => [...nodeKeys.lists(), params] as const,
  details: () => [...nodeKeys.all, 'detail'] as const,
  detail: (id: string) => [...nodeKeys.details(), id] as const,
};

// Hook for fetching nodes with pagination and filters
export const useNodes = (params?: NodeListParams, enabled = true) => {
  const { hasPermission } = usePermissions();

  return useQuery({
    queryKey: nodeKeys.list(params),
    queryFn: async () => {
      // Check permissions
      if (!hasPermission('nodes:read')) {
        throw new Error('Insufficient permissions to read nodes');
      }

      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.search) queryParams.append('search', params.search);
      if (params?.clusterId) queryParams.append('clusterId', params.clusterId);

      const response = await apiEndpoints.nodes.list();

      // Filter results client-side for now since API doesn't support query params
      let data = response.data as Node[];

      if (params?.search) {
        const searchLower = params.search.toLowerCase();
        data = data.filter((node) =>
          node.name.toLowerCase().includes(searchLower) ||
          (node.description && node.description.toLowerCase().includes(searchLower))
        );
      }

      // Apply pagination client-side
      const page = params?.page || 1;
      const limit = params?.limit || DEFAULT_PAGE_SIZE;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedData = data.slice(startIndex, endIndex);

      return {
        nodes: paginatedData,
        pagination: {
          page,
          limit,
          total: data.length,
          pages: Math.ceil(data.length / limit),
        },
      };
    },
    enabled: enabled && hasPermission('nodes:read'),
    staleTime: 60000, // 1 minute
    retry: 3,
  });
};

// Hook for fetching a single node
export const useNode = (id: string, enabled = true) => {
  const { hasPermission } = usePermissions();

  return useQuery({
    queryKey: nodeKeys.detail(id),
    queryFn: async () => {
      // Check permissions
      if (!hasPermission('nodes:read')) {
        throw new Error('Insufficient permissions to read nodes');
      }

      const response = await apiEndpoints.nodes.get(id);
      return response.data as Node;
    },
    enabled: enabled && !!id && hasPermission('nodes:read'),
    staleTime: 30000, // 30 seconds
    retry: 3,
  });
};

// Mutation hook for creating nodes
export const useCreateNode = () => {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();

  return useMutation({
    mutationFn: async (data: CreateNodeData) => {
      // Check permissions
      if (!hasPermission('nodes:create')) {
        throw new Error('Insufficient permissions to create nodes');
      }

      const response = await apiEndpoints.nodes.create(data);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch nodes list
      queryClient.invalidateQueries({ queryKey: nodeKeys.lists() });
      toastManager.showSuccess('Node created successfully');
    },
    onError: (error) => {
      const errorMessage = handleApiError(error);
      toastManager.showError('Failed to create node', errorMessage);
    },
  });
};

// Mutation hook for updating nodes
export const useUpdateNode = () => {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateNodeData }) => {
      // Check permissions
      if (!hasPermission('nodes:update')) {
        throw new Error('Insufficient permissions to update nodes');
      }

      const response = await apiEndpoints.nodes.update(id, data);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      // Invalidate specific node and nodes list
      queryClient.invalidateQueries({ queryKey: nodeKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: nodeKeys.lists() });
      toastManager.showSuccess('Node updated successfully');
    },
    onError: (error) => {
      const errorMessage = handleApiError(error);
      toastManager.showError('Failed to update node', errorMessage);
    },
  });
};

// Mutation hook for deleting nodes
export const useDeleteNode = () => {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();

  return useMutation({
    mutationFn: async (id: string) => {
      // Check permissions
      if (!hasPermission('nodes:delete')) {
        throw new Error('Insufficient permissions to delete nodes');
      }

      const response = await apiEndpoints.nodes.delete(id);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      // Remove node from cache and invalidate lists
      queryClient.removeQueries({ queryKey: nodeKeys.detail(variables) });
      queryClient.invalidateQueries({ queryKey: nodeKeys.lists() });
      toastManager.showSuccess('Node deleted successfully');
    },
    onError: (error) => {
      const errorMessage = handleApiError(error);
      toastManager.showError('Failed to delete node', errorMessage);
    },
  });
};

// Mutation hook for assigning nodes to clusters
export const useAssignNodeToCluster = () => {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: AssignClusterData }) => {
      // Check permissions
      if (!hasPermission('nodes:update')) {
        throw new Error('Insufficient permissions to update nodes');
      }

      const response = await apiEndpoints.nodes.update(id, { clusterId: data.clusterId });
      return response.data;
    },
    onSuccess: (_data, variables) => {
      // Invalidate specific node and nodes list
      queryClient.invalidateQueries({ queryKey: nodeKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: nodeKeys.lists() });
      toastManager.showSuccess('Node assigned to cluster successfully');
    },
    onError: (error) => {
      const errorMessage = handleApiError(error);
      toastManager.showError('Failed to assign node to cluster', errorMessage);
    },
  });
};

// WebSocket subscription function for real-time node updates
export const subscribeToNodeUpdates = (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _nodeId: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _callback: (data: { type: string; node: Node }) => void
) => {
  // This would integrate with the WebSocket hook for real-time updates
  // For now, return a cleanup function
  // TODO: Integrate with useWebSocket hook when available

  // Placeholder implementation - in real implementation this would:
  // 1. Connect to WebSocket for node updates
  // 2. Listen for node status changes, container updates, etc.
  // 3. Call callback with real-time data

  return () => {
    // Cleanup subscription - close WebSocket connection, remove listeners, etc.
  };
};

// Default pagination settings
export const DEFAULT_PAGE_SIZE = 10;