import React from 'react';
import { StatsCard } from './ui/StatsCard';
import { useContainers } from '../hooks/useContainers';
import type { Container } from '../hooks/useContainers';
import { useNodes, useClusters } from '../hooks/useEntities';
import type { Node, Cluster } from '../hooks/useEntities';

// Icons (you can replace these with actual icon components if available)
const ContainerIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

const NodeIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
  </svg>
);

const ClusterIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const ActivityIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export const OverviewSection: React.FC = () => {
  // Fetch data using hooks
  const { data: containers, isLoading: containersLoading } = useContainers();
  const { data: nodes, isLoading: nodesLoading } = useNodes();
  const { data: clusters, isLoading: clustersLoading } = useClusters();

  // Calculate statistics with proper type checking
  const totalContainers = (containers as Container[])?.length || 0;
  const activeNodes = (nodes as Node[])?.filter((node: Node) => node.status === 'online').length || 0;
  const totalNodes = (nodes as Node[])?.length || 0;
  const activeClusters = (clusters as Cluster[])?.filter((cluster: Cluster) => cluster.status === 'active').length || 0;
  const totalClusters = (clusters as Cluster[])?.length || 0;

  // Determine health status for nodes and clusters
  const getNodeHealthStatus = () => {
    if (totalNodes === 0) return 'offline';
    if (activeNodes === totalNodes) return 'healthy';
    if (activeNodes > 0) return 'warning';
    return 'offline';
  };

  const getClusterHealthStatus = () => {
    if (totalClusters === 0) return 'offline';
    if (activeClusters === totalClusters) return 'healthy';
    if (activeClusters > 0) return 'warning';
    return 'offline';
  };

  const statsCards = [
    {
      title: 'Total Containers',
      value: totalContainers,
      status: (totalContainers > 0 ? 'healthy' : 'offline') as 'healthy' | 'offline',
      icon: <ContainerIcon />,
      loading: containersLoading,
    },
    {
      title: 'Active Nodes',
      value: `${activeNodes}/${totalNodes}`,
      status: getNodeHealthStatus() as 'healthy' | 'offline' | 'warning',
      icon: <NodeIcon />,
      loading: nodesLoading,
    },
    {
      title: 'Active Clusters',
      value: `${activeClusters}/${totalClusters}`,
      status: getClusterHealthStatus() as 'healthy' | 'offline' | 'warning',
      icon: <ClusterIcon />,
      loading: clustersLoading,
    },
    {
      title: 'System Health',
      value: 'Good',
      status: 'healthy' as const,
      icon: <ActivityIcon />,
      loading: containersLoading || nodesLoading || clustersLoading,
    },
  ];

  return (
    <div className="mb-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Overview
        </h2>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          System status and key metrics at a glance
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((card, index) => (
          <StatsCard
            key={index}
            title={card.title}
            value={card.value}
            status={card.status}
            icon={card.icon}
            loading={card.loading}
          />
        ))}
      </div>
    </div>
  );
};