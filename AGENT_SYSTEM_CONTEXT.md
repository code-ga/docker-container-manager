# MANDATORY CONTEXT FOR ALL AGENTS: This file provides essential project context. All AI agents (Grok, Gemini, ChatGPT, etc.) must read and adhere to this when contributing to Lormas Container Manager.

# Lormas Container Manager - Project Context

## Overview

Lormas is a Pterodactyl-like multi-node container management system designed for deploying and managing containerized applications across distributed infrastructure. The platform provides a centralized control plane for managing containers, nodes, and clusters with role-based access control (RBAC), egg-based deployment templates, and real-time monitoring capabilities.

### Core Features
- **Multi-node container orchestration**: Deploy and manage containers across multiple physical/virtual servers
- **Egg-based deployments**: Template-driven container configurations for consistent deployments
- **Role-based access control**: Granular permissions system for users, roles, and resources
- **Real-time monitoring**: Live container logs, status updates, and resource monitoring
- **WebSocket-based communication**: Real-time bidirectional communication between server and agents
- **RESTful API**: Comprehensive API for programmatic management of all resources

## Tech Stack

### Backend (Server)
- **Runtime**: Bun.js - Fast JavaScript runtime for high-performance server applications
- **Framework**: ElysiaJS - Type-safe web framework built on Bun with built-in validation
- **Authentication**: Better-Auth - Modern authentication with support for multiple providers
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **WebSocket**: Native WebSocket support for real-time agent communication
- **Deployment**: Docker containerization with multi-stage builds

### Agent (Node)
- **Runtime**: Bun.js/TypeScript - Lightweight agent for Docker operations
- **Communication**: WebSocket client for server-agent communication
- **Docker Integration**: Native Docker API via child_process for container lifecycle management
- **Authentication**: JWT token-based authentication with server

### Frontend (Dashboard)
- **Framework**: React 18 with TypeScript for type safety
- **Build Tool**: Vite for fast development and optimized production builds
- **Styling**: Tailwind CSS for utility-first CSS framework
- **Routing**: React Router for client-side navigation
- **Authentication**: Integration with Better-Auth for seamless auth flow

### Database Schema
```typescript
// Core entities with relationships
users -> roles (many-to-many via user_roles)
nodes -> clusters (many-to-one)
containers -> nodes (many-to-one), eggs (many-to-one)
eggs -> categories (many-to-one)
jobs -> containers (many-to-one), users (many-to-one)
```

## Key Components

### Database Schema
The system uses a comprehensive PostgreSQL schema with the following key tables:
- **Users & Authentication**: User management with Better-Auth integration
- **Roles & Permissions**: Hierarchical RBAC system with granular permissions
- **Nodes & Clusters**: Infrastructure management for container hosting
- **Eggs**: Deployment templates defining container configurations
- **Containers**: Runtime container instances with lifecycle tracking
- **Jobs**: Audit trail for container operations and user actions

### API Routes
```typescript
// Route structure with middleware
/api/auth/*          // Authentication endpoints (Better-Auth)
├── /api/users/*     // User management (CRUD, settings)
├── /api/roles/*     // Role and permission management
├── /api/nodes/*     // Node registration and management
├── /api/clusters/*  // Cluster organization
├── /api/eggs/*      // Egg templates and categories
└── /api/containers/* // Container lifecycle operations
```

### RBAC & Middleware
- **Permission System**: Hierarchical permissions with inheritance
- **Middleware Guards**: Route-level permission enforcement
- **Context-Aware**: User, role, and resource-scoped access control
- **Audit Trail**: Comprehensive logging of permission checks and access attempts

### WebSocket Integration
```typescript
// WebSocket message types
type WSMessage =
  | { type: 'agent_identify'; nodeName: string; version: string }
  | { type: 'command'; action: 'create' | 'start' | 'stop' | 'restart' | 'delete' | 'logs' }
  | { type: 'command_result'; commandId: string; status: 'success' | 'error' }
  | { type: 'ping' | 'pong' }
```

### Agent Script
Lightweight Bun.js agent that:
- Connects to server via WebSocket with JWT authentication
- Executes Docker commands via child_process
- Streams container logs and status updates
- Handles container lifecycle operations (create, start, stop, restart, delete)
- Provides real-time feedback to the central server

## Agent-Server Interaction

### Authentication Flow
```typescript
// Node registration process
POST /api/nodes
Authorization: Bearer ADMIN_TOKEN
{
  "name": "node-01",
  "description": "Production node"
}

// Response includes JWT token for agent authentication
{
  "id": "uuid",
  "name": "node-01",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### WebSocket Commands
```json
// Create container command
{
  "type": "command",
  "id": "command-uuid",
  "action": "create",
  "containerId": "container-uuid",
  "eggConfig": {
    "image": "nginx:alpine",
    "ports": [{"host": 8080, "container": 80}],
    "volumes": [{"host": "/data", "container": "/app/data"}]
  },
  "resources": {
    "cpu": 1.0,
    "memory": "512m",
    "disk": "10g"
  },
  "environment": {
    "ENV_VAR": "value"
  }
}
```

### Response Format
```json
{
  "type": "command_result",
  "commandId": "command-uuid",
  "status": "success",
  "result": {
    "containerId": "docker-container-id",
    "message": "Container created successfully"
  }
}
```

## Setup/Deployment

### Backend Deployment
```bash
# Install dependencies
cd backend
bun install

# Set up database
cp .env.example .env
# Configure database connection and auth secrets

# Run migrations
bun run db:migrate

# Seed initial data (creates superuser)
bun run db:seed

# Start server
bun run dev
```

### Agent Deployment
```bash
# Install agent on target node
mkdir -p /opt/lormas-agent
cd /opt/lormas-agent

# Copy agent files
cp agent.js /opt/lormas-agent/
cp .env.example .env

# Configure environment
echo "SERVER_URL=ws://your-server.com" >> .env
echo "NODE_TOKEN=your-node-jwt-token" >> .env

# Start agent
bun run agent.js
```

### First-Run Superuser
The seed process creates an initial superuser account:
- **Email**: admin@lormas.local
- **Password**: admin123 (change on first login)
- **Role**: Superuser with all permissions

## Current Status

### Backend Implementation
- ✅ **Complete**: Type-safe API with comprehensive route coverage
- ✅ **Complete**: PostgreSQL database schema with Drizzle ORM
- ✅ **Complete**: RBAC system with hierarchical permissions
- ✅ **Complete**: WebSocket integration for real-time communication
- ✅ **Complete**: JWT-based authentication with Better-Auth
- ✅ **Complete**: Middleware system for permission enforcement
- ✅ **Complete**: Agent script with Docker integration
- ✅ **Complete**: Container lifecycle management (CRUD operations)
- ✅ **Complete**: Real-time logging and status updates

### Agent Implementation
- ✅ **Complete**: Lightweight Bun.js agent with WebSocket client
- ✅ **Complete**: Docker command execution via child_process
- ✅ **Complete**: Token-based authentication with server
- ✅ **Complete**: Container lifecycle operations
- ✅ **Complete**: Log streaming and status reporting

### Frontend Implementation
- ⚠️ **Pending**: React dashboard with TypeScript
- ⚠️ **Pending**: Authentication integration
- ⚠️ **Pending**: Container management interface
- ⚠️ **Pending**: Real-time monitoring dashboard
- ⚠️ **Pending**: User and role management UI

## Future Work

### Frontend Development
- **React Dashboard**: Complete UI implementation with modern design
- **React Router**: Client-side routing for seamless navigation
- **Real-time Updates**: WebSocket integration for live container status
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS
- **Authentication Flow**: Complete login/signup/user management UI

### Integration Testing
- **End-to-End Tests**: Comprehensive testing of agent-server-frontend interactions
- **Load Testing**: Performance testing with multiple nodes and containers
- **Security Testing**: Penetration testing and security audit
- **Docker Integration**: Full containerization testing

### Advanced Features
- **Monitoring Dashboard**: Advanced metrics and alerting system
- **Backup/Restore**: Automated backup and disaster recovery
- **Scaling**: Horizontal scaling capabilities for high availability
- **Plugin System**: Extensible architecture for custom integrations

### Documentation
- **API Documentation**: OpenAPI/Swagger documentation
- **User Guides**: Comprehensive user and admin documentation
- **Developer Guides**: Contributing guidelines and architecture docs
- **Deployment Guides**: Production deployment and scaling guides

## High-Availability Feature (HA Containers)

### Overview
The High-Availability (HA) feature enables users to create 'ha' containers that automatically migrate to another node in the same cluster if the current node fails (heartbeat lost >30s), or cross-cluster if no available nodes in the same cluster (with preferred_cluster optional). This ensures minimal downtime for critical workloads in the Lormas Container Manager.

**Key Capabilities:**
- **Failure Detection**: Node agents send heartbeats via WebSocket. If heartbeat is lost for >30 seconds, the node is marked unhealthy
- **Automatic Migration**: Containers automatically migrate when node heartbeat is lost >30 seconds
- **Smart Target Selection**: Prioritizes healthy nodes in the same or preferred cluster with sufficient capacity; fallback to any cluster if needed
- **Transfer Process**: Stop container on source node, create identical container on target using stored egg/resources/env/volumes/ports, update database
- **Cross-Cluster Fallback**: Falls back to any available cluster if no suitable nodes exist in preferred cluster
- **Manual Migration**: Administrators can trigger migrations manually for maintenance or optimization
- **Real-time Updates**: Live status updates via WebSocket for immediate UI feedback
- **Post-Migration**: Update node_id and migration_status, log history, notify via WebSocket for real-time UI updates

### Schema Extensions

#### Containers Table Updates
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

#### Extended Container Schema
```typescript
// Extended container schema for HA support
ALTER TABLE containers ADD COLUMN IF NOT EXISTS type VARCHAR(20) NOT NULL DEFAULT 'standard' CHECK (type IN ('standard', 'ha'));
ALTER TABLE containers ADD COLUMN IF NOT EXISTS migration_status VARCHAR(20) NOT NULL DEFAULT 'idle' CHECK (migration_status IN ('idle', 'migrating', 'completed', 'failed'));
ALTER TABLE containers ADD COLUMN IF NOT EXISTS preferred_cluster_id INTEGER REFERENCES clusters(id) ON DELETE SET NULL;
ALTER TABLE containers ADD COLUMN IF NOT EXISTS last_migration_at TIMESTAMP;
```

#### Node Health Table
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

#### Extended Node Health Table
```typescript
// New table for real-time node monitoring
CREATE TABLE node_health (
  node_id INTEGER PRIMARY KEY REFERENCES nodes(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'healthy' CHECK (status IN ('healthy', 'unhealthy')),
  last_heartbeat TIMESTAMP NOT NULL DEFAULT NOW(),
  capacity JSONB NOT NULL DEFAULT '{"cpu": 0, "memory": "0m"}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

#### Container Migration History Table
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

#### Extended Migration History Table
```typescript
// Audit trail for container migrations
CREATE TABLE container_migration_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  container_id INTEGER NOT NULL REFERENCES containers(id) ON DELETE CASCADE,
  from_node_id INTEGER NOT NULL REFERENCES nodes(id),
  to_node_id INTEGER NOT NULL REFERENCES nodes(id),
  status VARCHAR(20) NOT NULL CHECK (status IN ('completed', 'failed')),
  timestamp TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### APIs

#### Extended Container Creation
```typescript
// POST /api/v1/containers - Extended for HA support
{
  "name": "ha-web-server",
  "eggId": "nginx-uuid",
  "nodeId": "target-node-uuid",
  "type": "ha",  // NEW: Enables HA migration
  "preferred_cluster_id": "cluster-uuid",  // OPTIONAL: Preferred cluster for migrations
  "resources": {
    "cpu": 1.0,
    "memory": "512m",
    "disk": "10g"
  },
  "environment": {
    "PORT": "80"
  }
}
```

Update container lifecycle endpoints (e.g., DELETE /containers/:id) to check migration_status != 'migrating' for HA containers.

#### Health Monitoring
```typescript
// GET /api/v1/health - Node health status
GET /api/v1/health
Authorization: Bearer TOKEN
Response: {
  "nodes": [
    {
      "nodeId": 1,
      "status": "healthy",
      "lastHeartbeat": "2024-01-01T10:00:00Z",
      "capacity": { "cpu": 2.0, "memory": "4g" }
    }
  ]
}
```

#### Migration Operations
```typescript
// POST /api/v1/containers/:id/migrate - Manual migration trigger
POST /api/v1/containers/123/migrate
Authorization: Bearer TOKEN
Content-Type: application/json
{
  "force": false  // Optional: Force migration even if node is healthy
}

// GET /api/v1/containers/:id/migration-history - Migration history
GET /api/v1/containers/123/migration-history
Authorization: Bearer TOKEN
Response: {
  "migrations": [
    {
      "id": "uuid",
      "fromNodeId": 1,
      "toNodeId": 2,
      "status": "completed",
      "timestamp": "2024-01-01T10:00:00Z"
    }
  ]
}
```

### Monitoring

#### WebSocket Heartbeat (10s Interval)
```typescript
// Agent heartbeat payload
{
  "type": "heartbeat",
  "nodeId": 1,
  "timestamp": "2024-01-01T10:00:00.000Z",
  "resources": {
    "cpu": 1.5,
    "memory": "2g"
  }
}

// Backend heartbeat handling
case 'heartbeat':
  const { nodeId, timestamp, resources } = message;
  await db.update(nodeHealth)
    .set({
      lastHeartbeat: new Date(timestamp),
      status: 'healthy',
      capacity: resources
    })
    .where(eq(nodeHealth.nodeId, nodeId));
  // Also update containers on this node if HA
  break;
```

#### Failure Detection Cron (30s Interval)
```typescript
// Cron job for detecting unhealthy nodes
cron.schedule('*/30 * * * * *', async () => {
  const unhealthyNodes = await db.query.nodeHealth.findMany({
    where: sql`${nodeHealth.lastHeartbeat} < NOW() - INTERVAL '30 seconds'`
  });

  for (const node of unhealthyNodes) {
    await db.update(nodeHealth)
      .set({ status: 'unhealthy' })
      .where(eq(nodeHealth.nodeId, node.nodeId));

    // Trigger migrations for HA containers
    const haContainers = await db.query.containers.findMany({
      where: and(
        eq(containers.type, 'ha'),
        eq(containers.nodeId, node.nodeId),
        eq(containers.migrationStatus, 'idle')
      )
    });

    for (const container of haContainers) {
      await migrate(container.id);
    }
  }
});
```

#### Enhanced Failure Detection Implementation
```typescript
// In backend/src/index.ts, add cron job every 30 seconds using node-cron
import cron from 'node-cron';
import { migrate } from './utils/migration';

cron.schedule('*/30 * * * * *', async () => {
  const unhealthyNodes = await db.query.nodeHealth.findMany({
    where: sql`${nodeHealth.lastHeartbeat} < NOW() - INTERVAL '30 seconds'`,
  });
  for (const node of unhealthyNodes) {
    await db.update(nodeHealth).set({ status: 'unhealthy' }).where(eq(nodeHealth.nodeId, node.nodeId));
    const haContainers = await db.query.containers.findMany({
      where: and(eq(containers.type, 'ha'), eq(containers.nodeId, node.nodeId), eq(containers.migrationStatus, 'idle')),
    });
    for (const container of haContainers) {
      await migrate(container.id);
    }
  }
});
```

### Agent Updates

Update `agent/agent.ts` to support heartbeats and migration creates.

#### Heartbeat Sending (10s Interval)
```typescript
// Add interval every 10 seconds
setInterval(async () => {
  const resources = await getUsage(); // Stub: return { cpu: 0.5, memory: '256m' }
  this.send({
    type: 'heartbeat',
    nodeId: NODE_ID,
    timestamp: new Date().toISOString(),
    resources,
  });
}, 10000);

// Stub getUsage function
async function getUsage() {
  // Implement with os or docker stats; stub for now
  return { cpu: 1.0, memory: '512m' };
}
```

#### New Command Handler
```typescript
// In executeCommand, add case for 'migrate_create'
case 'migrate_create':
  const { config } = command;
  // Similar to 'create' but use provided config (eggConfig, resources, etc.)
  // Build docker run with config, return new containerId
  const { stdout } = await this.execDocker(`run -d --name ${command.containerId} ${buildDockerCmd(config)}`);
  return { containerId: stdout.trim() };
```

Ensure agent handles commands during migration without conflicts.

### Migration Logic

#### Migration Workflow
```typescript
// Core migration function
export async function migrate(containerId: string) {
  const container = await db.query.containers.findFirst({
    where: eq(containers.id, containerId)
  });

  if (!container || container.migrationStatus !== 'idle') return;

  // Lock container during migration
  await db.update(containers)
    .set({ migrationStatus: 'migrating' })
    .where(eq(containers.id, containerId));

  try {
    const currentNode = await db.query.nodes.findFirst({
      where: eq(nodes.id, container.nodeId)
    });

    const targetNode = await selectTargetNode(container);

    if (!targetNode) {
      throw new Error('No suitable target node found');
    }

    // Stop container on source node
    await sendToNode(currentNode.id, {
      type: 'command',
      action: 'stop',
      containerId
    });

    // Create container on target node
    const config = {
      eggConfig: container.eggConfig,
      resources: container.resources,
      environment: container.environment,
      volumes: container.volumes,
      ports: container.ports
    };

    const newContainerId = await sendToNode(targetNode.id, {
      type: 'command',
      action: 'migrate_create',
      containerId: `${containerId}-migrated`,
      config
    });

    // Start container on target node
    await sendToNode(targetNode.id, {
      type: 'command',
      action: 'start',
      containerId: newContainerId
    });

    // Update database
    await db.update(containers)
      .set({
        nodeId: targetNode.id,
        migrationStatus: 'completed',
        lastMigrationAt: new Date()
      })
      .where(eq(containers.id, containerId));

    // Log migration history
    await db.insert(containerMigrationHistory).values({
      containerId,
      fromNodeId: currentNode.id,
      toNodeId: targetNode.id,
      status: 'completed',
      timestamp: new Date()
    });

    // Notify WebSocket subscribers
    notifyWS(containerId, 'migration_completed', {
      targetNode: targetNode.id
    });

  } catch (error) {
    // Rollback on failure
    await db.update(containers)
      .set({ migrationStatus: 'failed' })
      .where(eq(containers.id, containerId));

    await db.insert(containerMigrationHistory).values({
      containerId,
      fromNodeId: currentNode.id,
      toNodeId: targetNode?.id || currentNode.id,
      status: 'failed',
      timestamp: new Date()
    });

    notifyWS(containerId, 'migration_failed', {
      error: error.message
    });
  }
}
```

#### Enhanced Migration Service Implementation
Create new file `backend/src/utils/migration.ts` with async function:
```typescript
export async function migrate(containerId: string) {
  const container = await db.query.containers.findFirst({ where: eq(containers.id, containerId) });
  if (!container || container.migrationStatus !== 'idle') return; // Idempotency check

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

#### Target Node Selection
```typescript
// Smart target selection algorithm
async function selectTargetNode(container) {
  // 1. Query healthy nodes in preferred cluster
  let candidates = await db.query.nodeHealth.findMany({
    where: and(
      eq(nodeHealth.status, 'healthy'),
      eq(nodes.clusterId, container.preferredClusterId)
    )
  });

  // 2. Fallback to same cluster if no preferred cluster
  if (candidates.length === 0 && container.preferredClusterId) {
    candidates = await db.query.nodeHealth.findMany({
      where: and(
        eq(nodeHealth.status, 'healthy'),
        eq(nodes.clusterId, container.clusterId)
      )
    });
  }

  // 3. Fallback to any healthy node
  if (candidates.length === 0) {
    candidates = await db.query.nodeHealth.findMany({
      where: eq(nodeHealth.status, 'healthy')
    });
  }

  // 4. Filter by capacity
  const suitableNodes = candidates.filter(node => {
    const capacity = node.capacity;
    const required = container.resources;
    return capacity.cpu >= required.cpu &&
           parseMemory(capacity.memory) >= parseMemory(required.memory);
  });

  return suitableNodes[0] || null;
}
```

### Frontend Integration

#### Container Creation Form
```typescript
// HA toggle in creation form
const [isHA, setIsHA] = useState(false);
const [preferredClusterId, setPreferredClusterId] = useState('');

const handleSubmit = async (formData) => {
  const payload = {
    ...formData,
    type: isHA ? 'ha' : 'standard',
    ...(isHA && preferredClusterId && { preferred_cluster_id: preferredClusterId })
  };

  await api.post('/containers', payload);
};
```

#### Status Badge Component
```typescript
// Migration status indicator
const MigrationStatus = ({ status }) => {
  const statusConfig = {
    idle: { color: 'gray', text: 'Idle' },
    migrating: { color: 'yellow', text: 'Migrating...' },
    completed: { color: 'green', text: 'Migrated' },
    failed: { color: 'red', text: 'Failed' }
  };

  const config = statusConfig[status] || statusConfig.idle;

  return (
    <div className={`px-2 py-1 rounded text-xs ${config.color}`}>
      {config.text}
    </div>
  );
};
```

#### Manual Migration Button
```typescript
// Manual migration trigger
const handleManualMigration = async () => {
  if (!confirm('Are you sure you want to migrate this container?')) return;

  setIsMigrating(true);
  try {
    await api.post(`/containers/${containerId}/migrate`);
    toast.success('Migration initiated successfully');
  } catch (error) {
    toast.error('Migration failed: ' + error.message);
  } finally {
    setIsMigrating(false);
  }
};
```

#### Migration History Table
```typescript
// Migration history display
const MigrationHistoryTable = ({ containerId }) => {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const fetchHistory = async () => {
      const response = await api.get(`/containers/${containerId}/migration-history`);
      setHistory(response.migrations);
    };
    fetchHistory();
  }, [containerId]);

  return (
    <DataTable
      data={history}
      columns={[
        { key: 'timestamp', label: 'Date' },
        { key: 'fromNodeId', label: 'From Node' },
        { key: 'toNodeId', label: 'To Node' },
        { key: 'status', label: 'Status' }
      ]}
    />
  );
};
```

#### WebSocket Subscription
```typescript
// Real-time migration updates
const useContainerHA = (containerId) => {
  const [migrationStatus, setMigrationStatus] = useState('idle');
  const [migrationHistory, setMigrationHistory] = useState([]);

  useEffect(() => {
    const ws = new WebSocket(`${WS_URL}/containers/${containerId}`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case 'migration_status':
          setMigrationStatus(data.status);
          break;
        case 'migration_completed':
          setMigrationHistory(prev => [...prev, data.migration]);
          break;
        case 'migration_failed':
          setMigrationStatus('failed');
          break;
      }
    };

    return () => ws.close();
  }, [containerId]);

  return { migrationStatus, migrationHistory };
};
```

### RBAC Permissions

#### New HA Permissions
```typescript
// Extended permissions for HA features
export const PERMISSIONS = {
  // Existing permissions...
  'container:ha:create': true,    // Create HA containers
  'migration:manage': true,       // Manual migration triggers
  'migration:view': true,         // View migration history
  'node:health:view': true        // View node health status
};
```

#### Permission Enforcement
```typescript
// Middleware integration
const haContainerGuard = (req, res, next) => {
  const { type } = req.body;

  if (type === 'ha' && !req.user.permissions.includes('container:ha:create')) {
    return res.status(403).json({ error: 'Insufficient permissions for HA containers' });
  }

  next();
};

const migrationGuard = (req, res, next) => {
  const action = req.method === 'POST' ? 'manage' : 'view';

  if (!req.user.permissions.includes(`migration:${action}`)) {
    return res.status(403).json({ error: 'Insufficient migration permissions' });
  }

  next();
};
```

### Safety Features

#### Capacity Validation
```typescript
// Resource capacity checking
const validateCapacity = (nodeCapacity, containerResources) => {
  const nodeCpu = nodeCapacity.cpu;
  const nodeMemory = parseMemory(nodeCapacity.memory);
  const requiredCpu = containerResources.cpu;
  const requiredMemory = parseMemory(containerResources.memory);

  return nodeCpu >= requiredCpu && nodeMemory >= requiredMemory;
};
```

#### Safety/Scalability Enhancements
- **Capacity Check**: In selectTargetNode, ensure node_health.capacity.cpu > container.resources.cpu and memory parsed/comparable. Query before migration.
- **Lock During Migration**: Set migration_status to 'migrating' to block concurrent operations (e.g., manual stop/delete).
- **Rollback**: On failure, stop any new container created, attempt restart on old node if it recovers, else mark 'failed' and notify.
- **Idempotency**: Check migration_status before starting; skip if already 'migrating' or 'completed'.
- **Cross-Cluster Migration**: Only if preferred_cluster_id is null or no healthy nodes in preferred/same cluster. Requires shared volumes for stateful data.

For scalability: Use DB transactions for updates, queue migrations (e.g., BullMQ) for high-volume clusters, monitor migration latency in logs.

#### Migration Locking
```typescript
// Prevent concurrent operations
const MIGRATION_LOCKS = new Map();

const acquireMigrationLock = async (containerId) => {
  if (MIGRATION_LOCKS.has(containerId)) {
    throw new Error('Migration already in progress');
  }

  MIGRATION_LOCKS.set(containerId, true);
  return () => MIGRATION_LOCKS.delete(containerId);
};

const releaseMigrationLock = (containerId) => {
  MIGRATION_LOCKS.delete(containerId);
};
```

#### Rollback Mechanism
```typescript
// Automatic rollback on failure
const rollbackMigration = async (containerId, originalNodeId, newNodeId) => {
  try {
    // Stop container on target node
    await sendToNode(newNodeId, {
      type: 'command',
      action: 'stop',
      containerId: `${containerId}-migrated`
    });

    // Attempt to restart on original node
    await sendToNode(originalNodeId, {
      type: 'command',
      action: 'start',
      containerId
    });

    // Update status
    await db.update(containers)
      .set({ migrationStatus: 'idle' })
      .where(eq(containers.id, containerId));

  } catch (rollbackError) {
    // Mark as permanently failed if rollback fails
    await db.update(containers)
      .set({ migrationStatus: 'failed' })
      .where(eq(containers.id, containerId));
  }
};
```

#### Idempotency Protection
```typescript
// Prevent duplicate migrations
const ensureIdempotentMigration = async (containerId) => {
  const container = await db.query.containers.findFirst({
    where: eq(containers.id, containerId)
  });

  if (container.migrationStatus === 'migrating') {
    throw new Error('Migration already in progress');
  }

  if (container.migrationStatus === 'completed') {
    throw new Error('Container already migrated');
  }

  return container;
};
```

## Workflow

1. **Create HA Container**: User selects 'ha' type and optional preferred_cluster in frontend form. POST to /containers validates perms, assigns initial node (capacity check), sets type='ha', migration_status='idle'.
2. **Assign and Monitor**: Send 'create'/'start' to agent. Agents send heartbeats every 10s; backend updates node_health.
3. **Heartbeat Loop**: Continuous WS heartbeats maintain node/container health status.
4. **Failure Detection**: Cron every 30s checks last_heartbeat >30s, marks node 'unhealthy', identifies HA containers on it.
5. **Auto-Migrate**: For each eligible container, call migrate(): lock, select target, stop old, create/start new, update DB/history, notify WS. Set 'completed' or 'failed'.
6. **Update/Notify**: DB reflects new node_id/last_migration_at, history logged, WS broadcasts to subscribed clients.
7. **Resume Operations**: Container runs on new node; frontend updates in real-time. Manual migrate available if needed.