// Test component to verify hook imports work correctly
import React from 'react';
import {
  useContainers,
  useContainer,
  useContainerStats,
  useContainerLogs,
  useMigrationHistory,
  useMigrateContainer,
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

// Import mutation hooks for testing
import {
  useCreateNode,
  useUpdateNode,
  useDeleteNode,
  useAssignNodeToCluster
} from '../hooks/useNodes';

import {
  useCreateCluster,
  useUpdateCluster,
  useDeleteCluster,
  useAddNodesToCluster,
  useRemoveNodesFromCluster
} from '../hooks/useClusters';

import {
  useCreateEgg,
  useUpdateEgg,
  useDeleteEgg
} from '../hooks/useEggs';

// Import new user and role hooks for testing
import {
  useUsers,
  useUser,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  useBulkUpdateRoles,
  userKeys
} from '../hooks/useUsers';

import {
  useRoles,
  useRolesWithPermissions,
  useRole,
  useCreateRole,
  useUpdateRole,
  useUpdateRolePermissions,
  useDeleteRole,
  roleKeys
} from '../hooks/useRoles';

const TestHooks: React.FC = () => {
  // Test container hooks
  const { data: containers } = useContainers();
  const { data: container } = useContainer('test-id');
  const { data: stats } = useContainerStats('test-id');
  const { data: logs } = useContainerLogs('test-id');
  const { data: migrationHistory } = useMigrationHistory('test-id');
  const migrateContainer = useMigrateContainer();

  // Test entity query hooks
  const { data: nodes } = useNodes();
  const { data: node } = useNode('test-id');
  const { data: eggs } = useEggs();
  const { data: egg } = useEgg('test-id');
  const { data: clusters } = useClusters();
  const { data: cluster } = useCluster('test-id');

  // Test user hooks
  const { data: users } = useUsers();
  const { data: user } = useUser('test-id');
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const bulkUpdateRoles = useBulkUpdateRoles();

  // Test role hooks
  const { data: roles } = useRoles();
  const { data: rolesWithPermissions } = useRolesWithPermissions();
  const { data: role } = useRole('test-id');
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const updateRolePermissions = useUpdateRolePermissions();
  const deleteRole = useDeleteRole();

  // Test mutation hooks
  const createNode = useCreateNode();
  const updateNode = useUpdateNode();
  const deleteNode = useDeleteNode();
  const assignNodeToCluster = useAssignNodeToCluster();

  const createCluster = useCreateCluster();
  const updateCluster = useUpdateCluster();
  const deleteCluster = useDeleteCluster();
  const addNodesToCluster = useAddNodesToCluster();
  const removeNodesFromCluster = useRemoveNodesFromCluster();

  const createEggMutation = useCreateEgg();
  const updateEgg = useUpdateEgg();
  const deleteEgg = useDeleteEgg();

  // Test query keys
  const containerQueryKeys = containerKeys;
  const nodeQueryKeys = nodeKeys;
  const eggQueryKeys = eggKeys;
  const clusterQueryKeys = clusterKeys;
  const userQueryKeys = userKeys;
  const roleQueryKeys = roleKeys;

  console.log('TestHooks loaded successfully', {
    containers,
    container,
    stats,
    logs,
    migrationHistory,
    nodes,
    node,
    eggs,
    egg,
    clusters,
    cluster,
    users,
    user,
    roles,
    rolesWithPermissions,
    role,
    mutations: {
      createNode,
      updateNode,
      deleteNode,
      assignNodeToCluster,
      createCluster,
      updateCluster,
      deleteCluster,
      addNodesToCluster,
      removeNodesFromCluster,
      createEggMutation,
      updateEgg,
      deleteEgg,
      createUser,
      updateUser,
      deleteUser,
      bulkUpdateRoles,
      createRole,
      updateRole,
      updateRolePermissions,
      deleteRole,
      migrateContainer
    },
    queryKeys: {
      containerQueryKeys,
      nodeQueryKeys,
      eggQueryKeys,
      clusterQueryKeys,
      userQueryKeys,
      roleQueryKeys
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