import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiEndpoints, handleApiError } from '../lib/api';
import { toastManager } from '../lib/toast';
import { usePermissions } from './usePermissions';
import type { Cluster } from './useEntities';

// Query parameters for clusters list
export interface ClusterListParams {
  page?: number;
  limit?: number;
  search?: string;
}

// Create cluster data
export interface CreateClusterData {
  name: string;
  description?: string;
  nodeIds?: string[];
}

// Update cluster data
export interface UpdateClusterData {
  name?: string;
  description?: string;
  nodeIds?: string[];
}

// Add nodes to cluster data
export interface AddNodesToClusterData {
  nodeIds: string[];
}

// Remove nodes from cluster data
export interface RemoveNodesFromClusterData {
  nodeIds: string[];
}

// Query keys factory
export const clusterKeys = {
  all: ['clusters'] as const,
  lists: () => [...clusterKeys.all, 'list'] as const,
  list: (params?: ClusterListParams) => [...clusterKeys.lists(), params] as const,
  details: () => [...clusterKeys.all, 'detail'] as const,
  detail: (id: string) => [...clusterKeys.details(), id] as const,
};

// Hook for fetching clusters with pagination and filters
export const useClusters = (params?: ClusterListParams, enabled = true) => {
  const { hasPermission } = usePermissions();

  return useQuery({
    queryKey: clusterKeys.list(params),
    queryFn: async () => {
      // Check permissions
      if (!hasPermission('clusters:read')) {
        throw new Error('Insufficient permissions to read clusters');
      }

      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.search) queryParams.append('search', params.search);

      const response = await apiEndpoints.clusters.list();

      // Filter results client-side for now since API doesn't support query params
      let data = response.data as Cluster[];

      if (params?.search) {
        const searchLower = params.search.toLowerCase();
        data = data.filter((cluster) =>
          cluster.name.toLowerCase().includes(searchLower) ||
          (cluster.description && cluster.description.toLowerCase().includes(searchLower))
        );
      }

      // Apply pagination client-side
      const page = params?.page || 1;
      const limit = params?.limit || DEFAULT_PAGE_SIZE;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedData = data.slice(startIndex, endIndex);

      return {
        clusters: paginatedData,
        pagination: {
          page,
          limit,
          total: data.length,
          pages: Math.ceil(data.length / limit),
        },
      };
    },
    enabled: enabled && hasPermission('clusters:read'),
    staleTime: 60000, // 1 minute
    retry: 3,
  });
};

// Hook for fetching a single cluster with nested nodes
export const useCluster = (id: string, enabled = true) => {
  const { hasPermission } = usePermissions();

  return useQuery({
    queryKey: clusterKeys.detail(id),
    queryFn: async () => {
      // Check permissions
      if (!hasPermission('clusters:read')) {
        throw new Error('Insufficient permissions to read clusters');
      }

      const response = await apiEndpoints.clusters.get(id);

      // If the API doesn't include nested nodes, we might need to fetch them separately
      // For now, assume the API response includes the cluster with nested nodes
      return response.data;
    },
    enabled: enabled && !!id && hasPermission('clusters:read'),
    staleTime: 30000, // 30 seconds
    retry: 3,
  });
};

// Mutation hook for creating clusters
export const useCreateCluster = () => {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();

  return useMutation({
    mutationFn: async (data: CreateClusterData) => {
      // Check permissions
      if (!hasPermission('clusters:create')) {
        throw new Error('Insufficient permissions to create clusters');
      }

      const response = await apiEndpoints.clusters.create(data);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch clusters list
      queryClient.invalidateQueries({ queryKey: clusterKeys.lists() });
      toastManager.showSuccess('Cluster created successfully');
    },
    onError: (error) => {
      const errorMessage = handleApiError(error);
      toastManager.showError('Failed to create cluster', errorMessage);
    },
  });
};

// Mutation hook for updating clusters
export const useUpdateCluster = () => {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateClusterData }) => {
      // Check permissions
      if (!hasPermission('clusters:update')) {
        throw new Error('Insufficient permissions to update clusters');
      }

      const response = await apiEndpoints.clusters.update(id, data);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      // Invalidate specific cluster and clusters list
      queryClient.invalidateQueries({ queryKey: clusterKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: clusterKeys.lists() });
      toastManager.showSuccess('Cluster updated successfully');
    },
    onError: (error) => {
      const errorMessage = handleApiError(error);
      toastManager.showError('Failed to update cluster', errorMessage);
    },
  });
};

// Mutation hook for deleting clusters
export const useDeleteCluster = () => {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();

  return useMutation({
    mutationFn: async (id: string) => {
      // Check permissions
      if (!hasPermission('clusters:delete')) {
        throw new Error('Insufficient permissions to delete clusters');
      }

      const response = await apiEndpoints.clusters.delete(id);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      // Remove cluster from cache and invalidate lists
      queryClient.removeQueries({ queryKey: clusterKeys.detail(variables) });
      queryClient.invalidateQueries({ queryKey: clusterKeys.lists() });
      toastManager.showSuccess('Cluster deleted successfully');
    },
    onError: (error) => {
      const errorMessage = handleApiError(error);
      toastManager.showError('Failed to delete cluster', errorMessage);
    },
  });
};

// Mutation hook for adding nodes to clusters
export const useAddNodesToCluster = () => {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: AddNodesToClusterData }) => {
      // Check permissions
      if (!hasPermission('clusters:update')) {
        throw new Error('Insufficient permissions to update clusters');
      }

      // Use the update endpoint with nodeIds
      const response = await apiEndpoints.clusters.update(id, { nodeIds: data.nodeIds });
      return response.data;
    },
    onSuccess: (_data, variables) => {
      // Invalidate specific cluster and clusters list
      queryClient.invalidateQueries({ queryKey: clusterKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: clusterKeys.lists() });
      toastManager.showSuccess('Nodes added to cluster successfully');
    },
    onError: (error) => {
      const errorMessage = handleApiError(error);
      toastManager.showError('Failed to add nodes to cluster', errorMessage);
    },
  });
};

// Mutation hook for removing nodes from clusters
export const useRemoveNodesFromCluster = () => {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: RemoveNodesFromClusterData }) => {
      // Check permissions
      if (!hasPermission('clusters:update')) {
        throw new Error('Insufficient permissions to update clusters');
      }

      // For remove operation, we need to get current nodes and filter out the ones to remove
      const currentCluster = await apiEndpoints.clusters.get(id);
      const clusterData = currentCluster.data as Cluster;
      const currentNodeIds = clusterData.nodes || [];
      const updatedNodeIds = currentNodeIds.filter((nodeId: string) => !data.nodeIds.includes(nodeId));

      const response = await apiEndpoints.clusters.update(id, { nodeIds: updatedNodeIds });
      return response.data;
    },
    onSuccess: (_data, variables) => {
      // Invalidate specific cluster and clusters list
      queryClient.invalidateQueries({ queryKey: clusterKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: clusterKeys.lists() });
      toastManager.showSuccess('Nodes removed from cluster successfully');
    },
    onError: (error) => {
      const errorMessage = handleApiError(error);
      toastManager.showError('Failed to remove nodes from cluster', errorMessage);
    },
  });
};

// Default pagination settings
export const DEFAULT_PAGE_SIZE = 10;