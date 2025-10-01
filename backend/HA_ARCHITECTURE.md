# HA Container Architecture

## Overview

HA type for fault-tolerant containers, failure detection via WS heartbeat, migration workflow (trigger, select target, transfer, update).

The High-Availability (HA) feature enables users to create 'ha' containers that automatically migrate to another node in the same cluster if the current node fails (heartbeat lost >30s), or cross-cluster if no available nodes in the same cluster (with preferred_cluster optional). This ensures minimal downtime for critical workloads in the Lormas Container Manager.

Key aspects:
- **Failure Detection**: Node agents send heartbeats via WebSocket. If heartbeat is lost for >30 seconds, the node is marked unhealthy.
- **Migration Trigger**: Automatic on failure detection for HA containers; manual option available.
- **Target Selection**: Prefer healthy nodes in the same or preferred cluster with sufficient capacity; fallback to any cluster if needed.
- **Transfer Process**: Stop container on source node, create identical container on target using stored egg/resources/env/volumes/ports, update database.
- **Post-Migration**: Update node_id and migration_status, log history, notify via WebSocket for real-time UI updates.

## Schema Extensions

Extend the database schema to support HA monitoring and history.

### Containers Table Updates
Add/update columns in the `containers` table:
- `type`: Enum ('standard' | 'ha') – Defaults to 'standard'. Determines if HA migration is enabled.
- `migration_status`: Enum ('idle' | 'migrating' | 'completed' | 'failed') – Tracks current migration state. Defaults to 'idle'.
- `preferred_cluster_id`: Optional foreign key to `clusters.id` – Specifies preferred cluster for migrations.
- `last_migration_at`: Timestamp – Records the timestamp of the last successful migration.

Example Drizzle migration:
```typescript
// In a new migration file
import { sql } from 'drizzle-orm';

export const up = async (db) => {
  await db.execute(sql`
    ALTER TABLE containers
    ADD COLUMN IF NOT EXISTS type VARCHAR(20) NOT NULL DEFAULT 'standard' CHECK (type IN ('standard', 'ha')),
    ADD COLUMN IF NOT EXISTS migration_status VARCHAR(20) NOT NULL DEFAULT 'idle' CHECK (migration_status IN ('idle', 'migrating', 'completed', 'failed')),
    ADD COLUMN IF NOT EXISTS preferred_cluster_id INTEGER REFERENCES clusters(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS last_migration_at TIMESTAMP;
  `);
};
```

### Node Health Table
New table `node_health` for real-time node monitoring:
- `node_id`: Foreign key to `nodes.id` (primary key).
- `status`: Enum ('healthy' | 'unhealthy') – Current node health.
- `last_heartbeat`: Timestamp – Last heartbeat received.
- `capacity`: JSON – Available resources {cpu: number, memory: string (e.g., '512m')}.

Example schema:
```typescript
import { pgTable, integer, timestamp, text, jsonb, pgEnum } from 'drizzle-orm/pg-core';

const nodeStatusEnum = pgEnum('node_status', ['healthy', 'unhealthy']);

export const nodeHealth = pgTable('node_health', {
  nodeId: integer('node_id').references(() => nodes.id, { onDelete: 'cascade' }).primaryKey(),
  status: nodeStatusEnum('status').default('healthy').notNull(),
  lastHeartbeat: timestamp('last_heartbeat').defaultNow().notNull(),
  capacity: jsonb('capacity').notNull().default({ cpu: 0, memory: '0m' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

### Container Migration History Table
New table `container_migration_history` to log migrations:
- `id`: Primary key (UUID or serial).
- `container_id`: Foreign key to `containers.id`.
- `from_node_id`: Foreign key to `nodes.id` (source node).
- `to_node_id`: Foreign key to `nodes.id` (target node).
- `status`: Enum ('completed' | 'failed') – Migration outcome.
- `timestamp`: Timestamp – When migration occurred.

Example schema:
```typescript
import { pgTable, uuid, integer, timestamp, pgEnum } from 'drizzle-orm/pg-core';

const migrationStatusEnum = pgEnum('migration_status', ['completed', 'failed']);

export const containerMigrationHistory = pgTable('container_migration_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  containerId: integer('container_id').references(() => containers.id, { onDelete: 'cascade' }).notNull(),
  fromNodeId: integer('from_node_id').references(() => nodes.id).notNull(),
  toNodeId: integer('to_node_id').references(() => nodes.id).notNull(),
  status: migrationStatusEnum('status').notNull(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});
```

Update seed.ts to initialize node_health for existing nodes if needed.

## Backend Changes

Integrate HA support into existing backend APIs and services.

### API Extensions
- **POST /api/v1/containers**: Extend request body to include `type: 'ha'` and optional `preferred_cluster_id`. Validate and require 'container:ha:create' permission for HA type. On creation, set migration_status to 'idle' and perform initial node assignment with capacity check.
- **GET /api/v1/containers/:id/migration-history**: Return list of migration events from container_migration_history table. Requires 'migration:view' permission.
- **POST /api/v1/containers/:id/migrate**: Manual migration trigger. Body: `{ force: boolean }`. Requires 'migration:manage' permission. Calls migration service.

Update container lifecycle endpoints (e.g., DELETE /containers/:id) to check migration_status != 'migrating' for HA containers.

### Monitoring and Detection
- **WebSocket Heartbeat Handling**: In `backend/src/libs/websocket.ts`, extend `onMessage` to handle 'heartbeat' type with validation and logging:
  ```typescript
  case 'heartbeat':
    const { nodeId, timestamp, resources } = message;
    await db.update(nodeHealth)
      .set({ lastHeartbeat: new Date(timestamp), status: 'healthy', capacity: resources })
      .where(eq(nodeHealth.nodeId, nodeId));

    // Log heartbeat with structured data
    logger.info('Node heartbeat received', {
      nodeId,
      timestamp,
      resources,
      status: 'healthy'
    });

    // Also update containers on this node if HA
    break;
  ```
- **Failure Detection Cron**: In `backend/src/index.ts`, add cron job every 30 seconds using node-cron with comprehensive logging:
  ```typescript
  import cron from 'node-cron';
  import { migrate } from './utils/migration';
  import { logger } from './utils/logger';

  cron.schedule('*/30 * * * * *', async () => {
    logger.debug('Running HA failure detection check');

    const unhealthyNodes = await db.query.nodeHealth.findMany({
      where: sql`${nodeHealth.lastHeartbeat} < NOW() - INTERVAL '30 seconds'`,
    });

    for (const node of unhealthyNodes) {
      logger.warn('Node marked unhealthy - heartbeat timeout', {
        nodeId: node.nodeId,
        lastHeartbeat: node.lastHeartbeat
      });

      await db.update(nodeHealth).set({ status: 'unhealthy' }).where(eq(nodeHealth.nodeId, node.nodeId));

      const haContainers = await db.query.containers.findMany({
        where: and(eq(containers.type, 'ha'), eq(containers.nodeId, node.nodeId), eq(containers.migrationStatus, 'idle')),
      });

      logger.info('Initiating migrations for unhealthy node', {
        nodeId: node.nodeId,
        containerCount: haContainers.length
      });

      for (const container of haContainers) {
        await migrate(container.id);
      }
    }
  });
  ```

### Migration Service
Create new file `backend/src/utils/migration.ts` with async function and comprehensive logging:
```typescript
import { logger } from './logger';

export async function migrate(containerId: string) {
  logger.info('Starting container migration', { containerId });

  const container = await db.query.containers.findFirst({ where: eq(containers.id, containerId) });
  if (!container || container.migrationStatus !== 'idle') {
    logger.warn('Migration skipped - invalid state', { containerId, status: container?.migrationStatus });
    return; // Idempotency check
  }

  await db.update(containers).set({ migrationStatus: 'migrating' }).where(eq(containers.id, containerId));

  const currentNode = await db.query.nodes.findFirst({ where: eq(nodes.id, container.nodeId) });
  const targetNode = await selectTargetNode(container); // Helper: query healthy nodes in preferred_cluster_id or any, with capacity > container resources

  if (!targetNode) {
    await db.update(containers).set({ migrationStatus: 'failed' }).where(eq(containers.id, containerId));
    notifyWS(containerId, 'migration_failed', { reason: 'No suitable target node' });
    return;
  }

  try {
    // Send stop to old agent
    sendToNode(currentNode.id, { type: 'command', action: 'stop', containerId });

    // Copy config from DB
    const config = { eggConfig: container.eggConfig, resources: container.resources, environment: container.environment, volumes: container.volumes, ports: container.ports };

    // Send create to new agent
    const newContainerId = await sendToNode(targetNode.id, { type: 'command', action: 'migrate_create', containerId: `${containerId}-migrated`, config });

    // Start new container
    sendToNode(targetNode.id, { type: 'command', action: 'start', containerId: newContainerId });

    // Update DB
    await db.update(containers).set({ nodeId: targetNode.id, migrationStatus: 'completed', lastMigrationAt: new Date() }).where(eq(containers.id, containerId));

    // Log history
    await db.insert(containerMigrationHistory).values({
      containerId,
      fromNodeId: currentNode.id,
      toNodeId: targetNode.id,
      status: 'completed',
      timestamp: new Date(),
    });

    notifyWS(containerId, 'migration_completed', { targetNode: targetNode.id });
  } catch (error) {
    // Rollback: stop new if exists, restart old if possible
    if (newContainerId) sendToNode(targetNode.id, { type: 'command', action: 'stop', containerId: newContainerId });
    await db.update(containers).set({ migrationStatus: 'failed' }).where(eq(containers.id, containerId));
    await db.insert(containerMigrationHistory).values({
      containerId,
      fromNodeId: currentNode.id,
      toNodeId: targetNode.id,
      status: 'failed',
      timestamp: new Date(),
    });
    notifyWS(containerId, 'migration_failed', { error: error.message });
  }
}

async function selectTargetNode(container) {
  // Query logic: prefer preferred_cluster_id, then any; filter status='healthy', capacity.cpu > container.resources.cpu, etc.
  // Return first suitable node
}
```

Integrate `sendToNode` and `notifyWS` using existing websocket.ts utilities.

## Agent Updates

Update `agent/agent.ts` to support heartbeats and migration creates.

- **Heartbeat Sending**: Add interval every 10 seconds:
  ```typescript
  setInterval(async () => {
    const resources = await getUsage(); // Stub: return { cpu: 0.5, memory: '256m' }
    this.send({
      type: 'heartbeat',
      nodeId: NODE_ID,
      timestamp: new Date().toISOString(),
      resources,
    });
  }, 10000);
  ```

  Stub `getUsage`:
  ```typescript
  async function getUsage() {
    // Implement with os or docker stats; stub for now
    return { cpu: 1.0, memory: '512m' };
  }
  ```

- **New Command Handler**: In `executeCommand`, add case for 'migrate_create':
  ```typescript
  case 'migrate_create':
    const { config } = command;
    // Similar to 'create' but use provided config (eggConfig, resources, etc.)
    // Build docker run with config, return new containerId
    const { stdout } = await this.execDocker(`run -d --name ${command.containerId} ${buildDockerCmd(config)}`);
    return { containerId: stdout.trim() };
  ```

Ensure agent handles commands during migration without conflicts.

## Frontend Changes

Update React components for HA support.

- **Container Creation Form**: In creation modal or form (e.g., extend ContainerCard.tsx or new form):
  - Add toggle switch for HA type: if enabled, set `type: 'ha'`.
  - Conditional dropdown for preferred_cluster: fetch options from GET /api/v1/clusters, send `preferred_cluster_id` in POST body.
  - Use FormBuilder.tsx for dynamic fields.

- **Container Detail Page**: 
  - Display `migration_status` as badge or status indicator (e.g., in ContainerCard.tsx).
  - Add table for migration history: fetch from GET /containers/:id/migration-history, use DataTable.tsx.
  - Manual migrate button: POST /containers/:id/migrate with confirm modal (Modal.tsx). Show loading on request.
  - Real-time updates: Subscribe to WS for container events (extend useContainerLogs.ts hook) to update status/history live.

Integrate with DarkThemeProvider and AnimeWrapper for UI consistency. Use Toast.tsx for migration notifications.

## RBAC

Add new permissions in `backend/src/permissions.ts`:
```typescript
export const PERMISSIONS = {
  // Existing...
  'container:ha:create': true, // For creating HA containers
  'migration:manage': true,    // For manual migrations
  'migration:view': true,      // For viewing history
};
```

Seed to superadmin role in seed.ts:
```typescript
// In seed roles
await db.insert(rolePermissions).values([
  { roleId: superadminId, permission: 'container:ha:create' },
  { roleId: superadminId, permission: 'migration:manage' },
  { roleId: superadminId, permission: 'migration:view' },
]);
```

Enforce in permissions-guard.ts for new endpoints/services.

## Safety/Scalability

- **Capacity Check**: In selectTargetNode, ensure node_health.capacity.cpu > container.resources.cpu and memory parsed/comparable. Query before migration with validation.
- **Lock During Migration**: Set migration_status to 'migrating' to block concurrent operations (e.g., manual stop/delete).
- **Rollback**: On failure, stop any new container created, attempt restart on old node if it recovers, else mark 'failed' and notify.
- **Idempotency**: Check migration_status before starting; skip if already 'migrating' or 'completed'.
- **Cross-Cluster Migration**: Only if preferred_cluster_id is null or no healthy nodes in preferred/same cluster. Requires shared volumes for stateful data.
- **Comprehensive Logging**: All migration events logged with structured data for monitoring and debugging.
- **Message Validation**: All WebSocket messages validated using TypeBox schemas for type safety.

For scalability: Use DB transactions for updates, queue migrations (e.g., BullMQ) for high-volume clusters, monitor migration latency in logs with configurable log levels.

## Workflow

1. **Create HA Container**: User selects 'ha' type and optional preferred_cluster in frontend form. POST to /containers validates perms, assigns initial node (capacity check), sets type='ha', migration_status='idle'.
2. **Assign and Monitor**: Send 'create'/'start' to agent. Agents send heartbeats every 10s; backend updates node_health.
3. **Heartbeat Loop**: Continuous WS heartbeats maintain node/container health status.
4. **Failure Detection**: Cron every 30s checks last_heartbeat >30s, marks node 'unhealthy', identifies HA containers on it.
5. **Auto-Migrate**: For each eligible container, call migrate(): lock, select target, stop old, create/start new, update DB/history, notify WS. Set 'completed' or 'failed'.
6. **Update/Notify**: DB reflects new node_id/last_migration_at, history logged, WS broadcasts to subscribed clients.
7. **Resume Operations**: Container runs on new node; frontend updates in real-time. Manual migrate available if needed.

## Frontend HA Integration

The High Availability system is fully integrated with the React frontend application, providing users with comprehensive migration management and monitoring capabilities.

### Container Management Interface

#### HA Container Creation
The frontend enhances container creation with HA-specific options:

- **HA Toggle**: Checkbox to enable HA type during container creation
- **Preferred Cluster Selection**: Dropdown to select preferred cluster for migrations
- **Resource Validation**: Real-time validation of HA requirements and node capacity
- **Preview Mode**: Visual preview of migration behavior before creation

```typescript
// Frontend container creation form
const haForm = {
  type: 'ha', // Enables HA features
  preferredClusterId: 'cluster-123',
  resources: { cpu: 1.0, memory: '512m' }
};
```

#### Container Detail Pages
Container detail views include comprehensive HA information:

- **Migration Status Badge**: Visual indicator showing current migration state
- **Migration History Table**: Chronological list of all migration events
- **Manual Migration Button**: Trigger migration to different node
- **Real-time Progress**: Live updates during active migrations

### Migration Management UI

#### Manual Migration Interface
Users can trigger manual migrations through an intuitive interface:

- **Target Node Selection**: Dropdown showing available healthy nodes
- **Migration Preview**: Shows what will be transferred and estimated downtime
- **Confirmation Dialog**: Clear warning about potential data loss for stateful containers
- **Progress Tracking**: Real-time progress bar with status updates

#### Migration History
Comprehensive migration tracking with filtering and search:

- **Timestamp**: When migration occurred
- **Source/Destination**: Node information for both ends
- **Status**: Success, failed, or cancelled
- **Duration**: How long the migration took
- **Trigger**: Automatic (failure) or manual
- **Error Details**: Specific error messages for failed migrations

### Real-time Updates

#### WebSocket Integration
The frontend receives real-time migration updates:

```typescript
// WebSocket message types for HA
{
  type: 'migration_started',
  containerId: 'container-123',
  fromNode: 'node-1',
  toNode: 'node-2'
}

{
  type: 'migration_progress',
  containerId: 'container-123',
  progress: 75,
  currentStep: 'transferring_data'
}

{
  type: 'migration_completed',
  containerId: 'container-123',
  newNodeId: 'node-2',
  duration: 45000
}
```

#### Status Indicators
Visual status indicators throughout the UI:

- **Idle**: Green badge with "HA Ready" text
- **Migrating**: Yellow spinning indicator with progress percentage
- **Completed**: Blue checkmark with timestamp
- **Failed**: Red X with error tooltip

### Admin Interface Integration

#### Cluster Management
Administrators can manage HA settings at the cluster level:

- **Node Health Monitoring**: Real-time view of node heartbeat status
- **Capacity Planning**: Visual representation of node resource utilization
- **Migration Policies**: Configure automatic migration triggers and preferences
- **Bulk Operations**: Mass migration of containers between clusters

#### System-wide HA Dashboard
Centralized view of all HA containers and their status:

- **Global Migration Status**: Overview of all active and recent migrations
- **Node Health Grid**: Visual grid showing all nodes and their health status
- **Resource Distribution**: Heat map of resource usage across clusters
- **Alert Management**: Notifications for failed migrations or unhealthy nodes

### User Experience Enhancements

#### Permission-based Access
HA features are controlled by granular permissions:

- **container:ha:create**: Create HA containers
- **migration:manage**: Trigger manual migrations
- **migration:view**: View migration history and status
- **cluster:admin**: Manage cluster-level HA settings

#### Responsive Design
All HA interfaces work seamlessly across devices:

- **Desktop**: Full-featured interface with detailed views
- **Tablet**: Optimized layout with collapsible sections
- **Mobile**: Essential features with touch-friendly controls

#### Accessibility
HA interfaces follow accessibility best practices:

- **Screen Reader Support**: Proper ARIA labels and announcements
- **Keyboard Navigation**: Full keyboard accessibility for all controls
- **High Contrast**: Support for high contrast mode
- **Reduced Motion**: Respects user's motion preferences

This comprehensive frontend integration makes HA container management intuitive and accessible while providing powerful monitoring and control capabilities.