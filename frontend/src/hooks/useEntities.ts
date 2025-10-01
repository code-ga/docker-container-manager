// Types
export interface Node {
  id: string;
  name: string;
  description?: string;
  status: 'online' | 'offline' | 'maintenance';
  clusterId?: string;
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

// Re-export hooks from specific files for convenience
export { useNodes, useNode, useCreateNode, useUpdateNode, useDeleteNode, useAssignNodeToCluster, nodeKeys, DEFAULT_PAGE_SIZE as NODES_DEFAULT_PAGE_SIZE } from './useNodes';
export { useClusters, useCluster, useCreateCluster, useUpdateCluster, useDeleteCluster, useAddNodesToCluster, useRemoveNodesFromCluster, clusterKeys, DEFAULT_PAGE_SIZE as CLUSTERS_DEFAULT_PAGE_SIZE } from './useClusters';
export { useEggs, useEgg, useCreateEgg, useUpdateEgg, useDeleteEgg, eggKeys, DEFAULT_PAGE_SIZE as EGGS_DEFAULT_PAGE_SIZE } from './useEggs';