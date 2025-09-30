// Test component to verify hook imports work correctly
import React from 'react';
import {
  useContainers,
  useContainer,
  useContainerStats,
  useContainerLogs,
  containerKeys
} from '../hooks/useContainers';

import {
  useNodes,
  useNode,
  useEggs,
  useEgg,
  useClusters,
  useCluster,
  nodeKeys,
  eggKeys,
  clusterKeys
} from '../hooks/useEntities';

const TestHooks: React.FC = () => {
  // Test container hooks
  const { data: containers } = useContainers();
  const { data: container } = useContainer('test-id');
  const { data: stats } = useContainerStats('test-id');
  const { data: logs } = useContainerLogs('test-id');

  // Test entity hooks
  const { data: nodes } = useNodes();
  const { data: node } = useNode('test-id');
  const { data: eggs } = useEggs();
  const { data: egg } = useEgg('test-id');
  const { data: clusters } = useClusters();
  const { data: cluster } = useCluster('test-id');

  // Test query keys
  const containerQueryKeys = containerKeys;
  const nodeQueryKeys = nodeKeys;
  const eggQueryKeys = eggKeys;
  const clusterQueryKeys = clusterKeys;

  console.log('TestHooks loaded successfully', {
    containers,
    container,
    stats,
    logs,
    nodes,
    node,
    eggs,
    egg,
    clusters,
    cluster,
    queryKeys: {
      containerQueryKeys,
      nodeQueryKeys,
      eggQueryKeys,
      clusterQueryKeys
    }
  });

  return (
    <div style={{ padding: '20px' }}>
      <h1>Hooks Test Component</h1>
      <p>All hooks imported and initialized successfully!</p>
      <p>Check console for detailed output.</p>
    </div>
  );
};

export default TestHooks;