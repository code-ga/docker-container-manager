import { useQuery } from '@tanstack/react-query';
import { apiEndpoints } from '../lib/api';

// Types
export interface Node {
  id: string;
  name: string;
  description?: string;
  status: 'online' | 'offline' | 'maintenance';
  resources: {
    cpu: number;
    memory: string;
    disk: string;
  };
  containers: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Egg {
  id: string;
  name: string;
  description?: string;
  image: string;
  environment?: Record<string, string>;
  ports?: Array<{ container: number; protocol: string }>;
  volumes?: Array<{ container: string; mount: string }>;
  createdAt: string;
  updatedAt: string;
}

export interface Cluster {
  id: string;
  name: string;
  description?: string;
  nodes: string[];
  status: 'active' | 'inactive' | 'degraded';
  createdAt: string;
  updatedAt: string;
}

// Query keys factories
export const nodeKeys = {
  all: ['nodes'] as const,
  lists: () => [...nodeKeys.all, 'list'] as const,
  list: (filters?: Record<string, string>) => [...nodeKeys.lists(), filters] as const,
  details: () => [...nodeKeys.all, 'detail'] as const,
  detail: (id: string) => [...nodeKeys.details(), id] as const,
};

export const eggKeys = {
  all: ['eggs'] as const,
  lists: () => [...eggKeys.all, 'list'] as const,
  list: (filters?: Record<string, string>) => [...eggKeys.lists(), filters] as const,
  details: () => [...eggKeys.all, 'detail'] as const,
  detail: (id: string) => [...eggKeys.details(), id] as const,
};

export const clusterKeys = {
  all: ['clusters'] as const,
  lists: () => [...clusterKeys.all, 'list'] as const,
  list: (filters?: Record<string, string>) => [...clusterKeys.lists(), filters] as const,
  details: () => [...clusterKeys.all, 'detail'] as const,
  detail: (id: string) => [...clusterKeys.details(), id] as const,
};

// Hook for fetching nodes
export const useNodes = (filters?: Record<string, string>, enabled = true) => {
  return useQuery({
    queryKey: nodeKeys.list(filters),
    queryFn: async () => {
      const response = await apiEndpoints.nodes.list();
      return response.data;
    },
    enabled,
    staleTime: 60000, // 1 minute
    retry: 3,
  });
};

// Hook for fetching a single node
export const useNode = (id: string, enabled = true) => {
  return useQuery({
    queryKey: nodeKeys.detail(id),
    queryFn: async () => {
      const response = await apiEndpoints.nodes.get(id);
      return response.data;
    },
    enabled: enabled && !!id,
    staleTime: 30000, // 30 seconds
    retry: 3,
  });
};

// Hook for fetching eggs
export const useEggs = (filters?: Record<string, string>, enabled = true) => {
  return useQuery({
    queryKey: eggKeys.list(filters),
    queryFn: async () => {
      const response = await apiEndpoints.eggs.list();
      return response.data;
    },
    enabled,
    staleTime: 300000, // 5 minutes - eggs don't change often
    retry: 3,
  });
};

// Hook for fetching a single egg
export const useEgg = (id: string, enabled = true) => {
  return useQuery({
    queryKey: eggKeys.detail(id),
    queryFn: async () => {
      const response = await apiEndpoints.eggs.get(id);
      return response.data;
    },
    enabled: enabled && !!id,
    staleTime: 300000, // 5 minutes
    retry: 3,
  });
};

// Hook for fetching clusters
export const useClusters = (filters?: Record<string, string>, enabled = true) => {
  return useQuery({
    queryKey: clusterKeys.list(filters),
    queryFn: async () => {
      const response = await apiEndpoints.clusters.list();
      return response.data;
    },
    enabled,
    staleTime: 60000, // 1 minute
    retry: 3,
  });
};

// Hook for fetching a single cluster
export const useCluster = (id: string, enabled = true) => {
  return useQuery({
    queryKey: clusterKeys.detail(id),
    queryFn: async () => {
      const response = await apiEndpoints.clusters.get(id);
      return response.data;
    },
    enabled: enabled && !!id,
    staleTime: 30000, // 30 seconds
    retry: 3,
  });
};