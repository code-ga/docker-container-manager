# Lormas Container Manager - System Architecture

## Overview

The Lormas Container Manager is a backend system designed to manage containerized resources across multiple nodes, inspired by Pterodactyl. It provides a centralized API for user management, resource allocation, and container orchestration. Key components include:

- **Users**: Authenticated entities with assigned roles for access control.
- **Roles and Permissions**: Role-Based Access Control (RBAC) system to define granular permissions (e.g., create/stop containers, manage nodes).
- **Nodes and Clusters**: Physical or virtual machines (nodes) that host containers. Nodes can be grouped into clusters for logical organization and load distribution.
- **Eggs**: Configuration templates defining container blueprints, including Docker images, startup commands, environment variables, and resource limits.
- **Containers/Jobs**: Runtime instances created from eggs, deployed on nodes. Users can manage their own containers (start, stop, view logs, etc.), with permissions restricting actions.

The system uses a client-server architecture where the central server handles API requests, authentication, and orchestration, while node agents (lightweight services on nodes) execute container operations. No frontend is implemented yet; the focus is on the backend API.

High-level flow:
1. Users authenticate and interact via API.
2. Superuser (auto-created on first run) manages users, roles, and resources.
3. Users create containers from eggs, which are assigned to available nodes.
4. Node agents handle container lifecycle via API or WebSockets.

## Database Schema Design

The database uses Drizzle ORM with an existing `schema.ts` file in `backend/src/database/schema.ts`. Extend it with new tables for the required entities. Assume PostgreSQL (or SQLite for dev) as the underlying DB. All tables include standard fields like `id` (UUID primary key), `createdAt`, `updatedAt` (timestamps).

### Existing Tables (to Integrate)
- `users` (from Better-Auth): `id`, `email`, `name`, etc. Extend with `isSuperuser` boolean if needed.

### New/Extended Tables

- **roles**
  - `id`: UUID PK
  - `name`: string (unique, e.g., 'admin', 'user')
  - `description`: text (optional)

- **permissions**
  - `id`: UUID PK
  - `name`: string (unique, e.g., 'container:create', 'node:view', 'user:manage')
  - `description`: text (optional)
  - Resource-scoped permissions (e.g., 'container:own:*' for user-specific actions)

- **role_permissions** (many-to-many junction)
  - `roleId`: FK to roles.id
  - `permissionId`: FK to permissions.id
  - Composite PK (roleId, permissionId)

- **user_roles** (many-to-many junction)
  - `userId`: FK to users.id
  - `roleId`: FK to roles.id
  - Composite PK (userId, roleId)

- **clusters**
  - `id`: UUID PK
  - `name`: string (unique)
  - `description`: text (optional)

- **nodes**
  - `id`: UUID PK
  - `name`: string
  - `ipAddress`: string (node's IP/hostname)
  - `status`: enum ('online', 'offline', 'maintenance')
  - `clusterId`: FK to clusters.id (nullable, for ungrouped nodes)
  - `fqdn`: string (optional, for SSL)
  - `token`: string (secret for node authentication)

- **eggs**
  - `id`: UUID PK
  - `name`: string
  - `description`: text
  - `image`: string (Docker image, e.g., 'nginx:latest')
  - `startupCommand`: string (e.g., '/start.sh')
  - `envVars`: json (environment variables as key-value pairs)
  - `resourceLimits`: json (CPU, memory limits)
  - `isPublic`: boolean (default false; public eggs usable by all)

- **containers**
  - `id`: UUID PK
  - `name`: string
  - `userId`: FK to users.id (owner)
  - `eggId`: FK to eggs.id
  - `nodeId`: FK to nodes.id (assigned node)
  - `status`: enum ('creating', 'running', 'stopped', 'error')
  - `containerId`: string (Docker container ID on node)
  - `resourceAllocation`: json (allocated CPU/memory)
  - `envOverrides`: json (per-container env vars)
  - `mounts`: json (volume mounts)

- **user_container_assignments** (for shared access)
  - `userId`: FK to users.id
  - `containerId`: FK to containers.id
  - Composite PK (userId, containerId)
  - `roleId`: FK to roles.id (specific role for this assignment, e.g., 'viewer')

### Relationships
- Users ↔ Roles: Many-to-many via `user_roles`.
- Roles ↔ Permissions: Many-to-many via `role_permissions`.
- Containers → Users: One-to-many (owner); many-to-many via `user_container_assignments` for sharing.
- Containers → Eggs: Many-to-one (template).
- Containers → Nodes: Many-to-one (deployment target).
- Nodes → Clusters: Many-to-one (grouping).
- Constraints: Foreign keys with CASCADE on delete where appropriate (e.g., delete user_roles on user delete).

Migrations: Use Drizzle's migration tools to add these tables post-design.

## API Design

Build on existing Elysia setup in `src/index.ts` and routes in `src/routes/`. All endpoints under `/api/v1/` prefix. Integrate `auth-middleware.ts` for authentication (requires valid session/JWT). Use `permissions.ts` for RBAC checks (e.g., `hasPermission(user, 'container:create')`).

### Middleware
- Auth: Applied to all protected routes; extracts user from token.
- Permissions: Custom plugin checking user's roles against required permission (e.g., `permission('container:own:stop', { resourceId: containerId })` for owner-only).

### Endpoints (Elysia Routes)

- **Users** (`/api/v1/users`)
  - GET `/`: List users (permission: 'user:view')
  - GET `/:id`: View user (permission: 'user:view' or self)
  - POST `/`: Create user (permission: 'user:create'; superuser only for non-self)
  - PUT `/:id`: Update user (permission: 'user:update')
  - DELETE `/:id`: Delete user (permission: 'user:delete')

- **Roles** (`/api/v1/roles`)
  - GET `/`: List roles (permission: 'role:view')
  - GET `/:id`: View role (permission: 'role:view')
  - POST `/`: Create role (permission: 'role:create')
  - PUT `/:id`: Update role (permission: 'role:update')
  - DELETE `/:id`: Delete role (permission: 'role:delete')
  - POST `/:id/permissions`: Assign permissions (permission: 'role:manage')

- **Nodes** (`/api/v1/nodes`)
  - GET `/`: List nodes (permission: 'node:view')
  - GET `/:id`: View node (permission: 'node:view')
  - POST `/`: Add node (permission: 'node:create'; generates token for agent)
  - PUT `/:id`: Update node (permission: 'node:update')
  - DELETE `/:id`: Remove node (permission: 'node:delete')
  - POST `/:id/status`: Update status (node agent auth via token)

- **Eggs** (`/api/v1/eggs`)
  - GET `/`: List eggs (permission: 'egg:view')
  - GET `/:id`: View egg (permission: 'egg:view')
  - POST `/`: Create egg (permission: 'egg:create')
  - PUT `/:id`: Update egg (permission: 'egg:update')
  - DELETE `/:id`: Delete egg (permission: 'egg:delete')

- **Containers** (`/api/v1/containers`)
  - GET `/`: List own/all containers (permission: 'container:view'; filter by user)
  - GET `/:id`: View container (permission: 'container:view' or own)
  - POST `/`: Create from egg (permission: 'container:create'; assigns to node)
  - PUT `/:id`: Update config (permission: 'container:update' or own)
  - DELETE `/:id`: Delete (permission: 'container:delete' or own)
  - POST `/:id/start`: Start (permission: 'container:own:start')
  - POST `/:id/stop`: Stop (permission: 'container:own:stop')
  - GET `/:id/logs`: View logs (permission: 'container:own:logs')
  - POST `/:id/assign`: Assign to user (permission: 'container:share')

Error handling: Standard HTTP codes (401 Unauthorized, 403 Forbidden, 404 Not Found). Use Elysia's error plugin.

## Authentication & Authorization

- **Better-Auth Integration**: Use existing `src/libs/auth/` for session-based auth (cookies/JWT). Users table auto-managed by Better-Auth. Extend user schema with role assignments.
- **First-Run Superuser**: In `src/index.ts` (app startup hook), query DB for superuser (e.g., role 'superadmin'). If none, create user with email 'admin@example.com', temp password, and assign 'superadmin' role (all permissions).
- **RBAC Implementation**: In `src/permissions.ts`, define permission checks:
  - `hasPermission(userId, permission: string, resourceId?: string)`: Query user_roles → role_permissions.
  - Scoped: For own resources, check 'container:own:*' or exact match.
  - Superuser bypass: If `isSuperuser`, grant all.
- Sessions: Better-Auth handles login/logout; API uses Bearer tokens or cookies.

## Workflows

### Node Connection
- Admin adds node via POST /nodes (generates auth token).
- Node agent (separate service, e.g., Bun script on node) registers via POST /nodes/:id/register with token.
- Ongoing: WebSocket endpoint `/ws/nodes/:id` for real-time status/logs. Fallback: Polling GET /nodes/:id/heartbeat.
- Node agent pulls Docker images, executes commands.

### Container Lifecycle
1. User POST /containers {name, eggId, nodeId?} (auto-assign if unspecified, based on cluster load).
2. Server validates permissions, creates DB entry (status: 'creating').
3. Server sends task to node agent via WS/API (e.g., {action: 'create', egg: eggData, containerId}).
4. Agent: Pulls image, runs docker run with env/start cmd, returns containerId/logs.
5. Server updates DB (status: 'running').
6. Start/Stop: POST to server → forwards to agent.
7. Logs: Agent streams to WS; server proxies or stores in DB.
8. Delete: Stop + docker rm; cleanup DB.

Error handling: Retry on node failure; reassign to another node.

### Egg Application
- Eggs stored in DB (JSON for flexibility).
- On create: Server sends full egg config to agent (image, cmd, env).
- Updates: Propagate to existing containers if opted-in.

## Scalability Considerations

- **Multi-Node**: Central DB for state; nodes stateless for containers. Use load balancer for API (e.g., multiple server instances).
- **Horizontal Scaling**: Shard containers across clusters; auto-assign based on node capacity (query DB for online nodes with <80% load).
- **Database**: Index on foreign keys (e.g., userId in containers). Use connection pooling in Drizzle.
- **Real-Time**: WebSockets scale with Redis pub/sub if needed (future extension).
- **Performance**: Cache permissions/roles in-memory (e.g., Elysia state). Paginate lists (e.g., containers).
- **High Availability**: Nodes in clusters for failover; DB replication.

## Type Safety and Validation

### TypeScript Integration
The backend leverages TypeScript throughout for enhanced type safety and developer experience:

- **Interface Definitions**: Strong typing with interfaces like `EggConfig` for container configurations
- **Elimination of 'any' Types**: Strict typing policies ensure type safety across all modules
- **Type Organization**: Centralized type definitions in `backend/src/types/` with organized subdirectories:
  - `backend/src/types/websocket/` - WebSocket message types and schemas
  - `backend/src/types/index.ts` - Main type exports and interfaces

### TypeBox Validation
All API endpoints and WebSocket messages use TypeBox for runtime validation:

```typescript
import { Type } from '@sinclair/typebox';

// Example schema for container creation
const CreateContainerSchema = Type.Object({
  name: Type.String(),
  eggId: Type.String(),
  nodeId: Type.Optional(Type.String()),
  resources: Type.Object({
    cpu: Type.Number(),
    memory: Type.String(),
    disk: Type.String()
  })
});

// Applied to Elysia routes for automatic validation
app.post('/containers', async ({ body }) => {
  // body is fully typed and validated
}, {
  body: CreateContainerSchema
});
```

### WebSocket Type Safety
WebSocket handlers use Elysia's `TypedWebSocketHandler` for type-safe message handling:

```typescript
import { ElysiaWS } from 'elysia/ws';

// Type-safe WebSocket route with message schemas
app.ws('/api/ws/nodes', {
  body: CommandMessageSchema,
  response: CommandResultSchema,
  open(ws) {
    // ws.data is typed based on schema
    logger.info('Node connected', { nodeId: ws.data.nodeId });
  },
  message(ws, message) {
    // message is validated and typed
    switch (message.type) {
      case 'command':
        await handleCommand(ws, message);
        break;
    }
  }
});
```

## Logging Integration

### Centralized Logger
The system uses a centralized Pino-style logger in `backend/src/utils/logger.ts`:

```typescript
import { logger } from '../utils/logger';

// Structured logging with consistent formatting
logger.info('Container created successfully', {
  containerId: 'abc-123',
  userId: 'user-456',
  nodeId: 'node-789'
});

logger.error('Container creation failed', {
  error: error.message,
  containerId: 'abc-123',
  stack: error.stack
});
```

### Log Levels and Configuration
- **Environment-Based**: Configurable via `LOG_LEVEL` environment variable
- **Structured Output**: JSON formatting for production, pretty-printed for development
- **Multiple Levels**: trace, debug, info, warn, error with appropriate filtering
- **Context-Aware**: All logs include relevant context data for debugging

### Integration Points
- **API Routes**: Automatic request/response logging with timing
- **WebSocket Events**: Connection, message, and error logging
- **Database Operations**: Query logging and error tracking
- **Agent Communication**: Command execution and response logging

## WebSocket Architecture

### Elysia WebSocket Integration
The backend uses Elysia's native WebSocket support with enhanced type safety:

```typescript
// Type-safe WebSocket handler
app.ws('/api/ws/nodes', {
  body: Type.Object({
    type: Type.Union([
      Type.Literal('agent_identify'),
      Type.Literal('command'),
      Type.Literal('heartbeat')
    ]),
    nodeName: Type.Optional(Type.String()),
    version: Type.Optional(Type.String())
  }),
  response: Type.Object({
    type: Type.Union([
      Type.Literal('command_result'),
      Type.Literal('pong')
    ]),
    status: Type.Optional(Type.Union([
      Type.Literal('success'),
      Type.Literal('error')
    ]))
  }),
  async open(ws) {
    logger.info('Node agent connected', {
      nodeId: ws.data?.nodeId,
      remoteAddress: ws.remoteAddress
    });
  },
  async message(ws, message) {
    // Message is validated and typed
    await handleWebSocketMessage(ws, message);
  },
  async close(ws, code, reason) {
    logger.info('Node agent disconnected', {
      nodeId: ws.data?.nodeId,
      code,
      reason
    });
  }
});
```

### Message Flow Architecture
1. **Connection**: Node agents connect with JWT authentication via query parameter
2. **Identification**: Agents send `agent_identify` message with node details
3. **Heartbeat**: Regular heartbeat messages maintain connection health
4. **Commands**: Server sends validated command messages to agents
5. **Responses**: Agents respond with typed result messages
6. **Error Handling**: Structured error responses with proper logging

### Real-Time Features
- **Live Container Logs**: Streamed from agents to connected clients
- **Status Updates**: Real-time container and node status changes
- **Migration Events**: Live updates during HA container migrations
- **User Notifications**: WebSocket-based notifications for relevant events

## Other Design Decisions

- **Logging**: Centralized Pino-style logger with structured output and configurable levels
- **Security**: Node tokens rotated; API rate-limiting. Validate Docker images (trusted registry).
- **Extensibility**: Eggs support custom scripts/volumes. Permissions extensible via DB.
- **Integration**: Build on existing `src/routes/user.ts` for user endpoints; add new route files (e.g., `routes/nodes.ts`).
- **Testing**: Unit tests for permissions; integration for workflows (mock node agents).
- **Deployment**: Dockerize backend; nodes run agent as systemd service.

This design ensures modularity, security, and scalability while leveraging the existing Elysia/Better-Auth/Drizzle stack with enhanced type safety and validation.