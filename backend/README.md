# Lormas Container Manager Backend

A robust container management system backend built with Elysia, Bun, and PostgreSQL. Provides centralized control over Docker containers across multiple nodes with real-time monitoring and role-based access control.

## Overview

Lormas is a multi-node container management platform that allows you to:
- Deploy and manage containers across multiple servers
- Monitor container performance and logs in real-time
- Implement role-based access control for team management
- Use predefined "eggs" (container templates) for quick deployments
- Connect remote node agents via WebSocket for distributed management

## Prerequisites

- **Bun.js** (recommended) or Node.js 18+
- **PostgreSQL** database server
- **Docker** (for testing container operations locally)

### Installing Bun

```bash
# macOS/Linux
curl -fsSL https://bun.sh/install | bash

# Or via npm
npm install -g bun
```

### Setting up PostgreSQL

```bash
# Using Docker (recommended for development)
docker run --name postgres-lormas -e POSTGRES_DB=lormas -e POSTGRES_USER=lormas -e POSTGRES_PASSWORD=changeme -p 5432:5432 -d postgres:15

# Or install locally via your package manager
# Ubuntu/Debian
sudo apt install postgresql postgresql-contrib

# macOS with Homebrew
brew install postgresql
```

## Installation

1. **Clone and navigate to the backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your configuration:
   ```env
   DATABASE_URL=postgresql://lormas:changeme@localhost:5432/lormas
   BETTER_AUTH_SECRET=your-super-secret-key-here
   GITHUB_CLIENT_ID=your-github-oauth-app-id
   GITHUB_CLIENT_SECRET=your-github-oauth-app-secret
   DISCORD_CLIENT_ID=your-discord-oauth-app-id
   DISCORD_CLIENT_SECRET=your-discord-oauth-app-secret
   SUPERUSER_EMAIL=admin@lormas.com
   SUPERUSER_PASSWORD=ChangeMe123!
   PORT=3000
   ```

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Yes | - |
| `BETTER_AUTH_SECRET` | Secret key for Better-Auth | Yes | - |
| `GITHUB_CLIENT_ID` | GitHub OAuth app client ID | No | - |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth app client secret | No | - |
| `DISCORD_CLIENT_ID` | Discord OAuth app client ID | No | - |
| `DISCORD_CLIENT_SECRET` | Discord OAuth app client secret | No | - |
| `SUPERUSER_EMAIL` | Email for auto-created superuser | No | admin@lormas.com |
| `SUPERUSER_PASSWORD` | Password for auto-created superuser | No | ChangeMe123! |
| `PORT` | Server port | No | 3000 |
| `LOG_LEVEL` | Logging level (trace, debug, info, warn, error) | No | info |

## Logging

The backend uses a centralized Pino-style logger for consistent, structured logging across the application:

```typescript
import { logger } from './src/utils/logger';

// Info level with context data
logger.info('Container created successfully', {
  containerId: 'abc-123',
  userId: 'user-456',
  nodeId: 'node-789'
});

// Error level with error details
logger.error('Container creation failed', {
  error: error.message,
  containerId: 'abc-123',
  stack: error.stack
});
```

### Log Levels
- **trace**: Most verbose, for detailed debugging
- **debug**: Debug information for development
- **info**: General information about operations
- **warn**: Warning messages for potential issues
- **error**: Error messages for failures

### Configuration
Set the `LOG_LEVEL` environment variable to control which messages are output:
```env
LOG_LEVEL=debug  # Shows debug, info, warn, error
LOG_LEVEL=info   # Shows info, warn, error (default)
LOG_LEVEL=error  # Shows only error messages
```

## Type Safety

The backend leverages TypeScript with strict typing and TypeBox validation:

### Type Organization
- **WebSocket Types**: `backend/src/types/websocket/` - Message schemas and interfaces
- **Main Types**: `backend/src/types/index.ts` - Core type definitions
- **Validation**: Runtime validation using TypeBox schemas

### Import Examples
```typescript
// Import WebSocket types
import { CommandMessage, CommandResult } from './src/types/websocket';

// Import logger
import { logger } from './src/utils/logger';

// Import main types
import type { EggConfig, ResourceLimits } from './src/types';
```

## WebSocket Integration

The backend uses Elysia's native WebSocket support with type safety:

### Node Agent Communication
- **Endpoint**: `WS /api/ws/nodes` - Secure WebSocket connection for node agents
- **Authentication**: JWT token-based authentication via query parameters
- **Message Validation**: All messages validated using TypeBox schemas
- **Real-time Features**: Live container logs, status updates, and migration events

### Message Flow
1. Agent connects with JWT authentication
2. Agent sends identification message with node details
3. Server sends validated commands (create, start, stop, etc.)
4. Agent responds with typed results
5. Real-time status updates and logs streamed bidirectionally

## Running the Server

### Development Mode
```bash
bun run dev
```

The server will start on `http://localhost:3000` with hot reloading enabled.

### Production Mode
```bash
# Build (if needed)
bun run build

# Start
bun run src/index.ts
```

## First Run

On the first startup, the system will automatically:

1. **Initialize the database** with required tables and relationships
2. **Create a superuser** with the credentials specified in environment variables
3. **Set up default roles and permissions** for the RBAC system

The superuser credentials will be logged to the console:
```
✅ Superuser created successfully!
📧 Email: admin@lormas.com
🔑 Password: ChangeMe123!
⚠️  Please change the default password after first login!
```

## API Documentation

The API is available at `/api/v1` with the following main endpoints:

### Base URL
```
http://localhost:3000/api
```

### Authentication Endpoints
- `POST /api/auth/sign-in` - User login
- `POST /api/auth/sign-up` - User registration
- `POST /api/auth/sign-out` - User logout
- `GET /api/auth/session` - Get current session
- OAuth endpoints for GitHub and Discord

### Core Resource Endpoints

#### Users
- `GET /api/users` - List all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

#### Roles & Permissions
- `GET /api/roles` - List all roles
- `POST /api/roles` - Create new role
- `GET /api/roles/:id` - Get role by ID
- `PUT /api/roles/:id` - Update role
- `DELETE /api/roles/:id` - Delete role
- `GET /api/permissions` - List all permissions

#### Nodes
- `GET /api/nodes` - List all nodes
- `POST /api/nodes` - Register new node
- `GET /api/nodes/:id` - Get node by ID
- `PUT /api/nodes/:id` - Update node
- `DELETE /api/nodes/:id` - Delete node
- `PATCH /api/nodes/:id/token` - Rotate node token

#### Clusters
- `GET /api/clusters` - List all clusters
- `POST /api/clusters` - Create new cluster
- `GET /api/clusters/:id` - Get cluster by ID
- `PUT /api/clusters/:id` - Update cluster
- `DELETE /api/clusters/:id` - Delete cluster

#### Eggs (Container Templates)
- `GET /api/eggs` - List all eggs
- `POST /api/eggs` - Create new egg
- `GET /api/eggs/:id` - Get egg by ID
- `PUT /api/eggs/:id` - Update egg
- `DELETE /api/eggs/:id` - Delete egg

#### Containers
- `GET /api/containers` - List all containers
- `POST /api/containers` - Create new container
- `GET /api/containers/:id` - Get container by ID
- `PUT /api/containers/:id` - Update container
- `DELETE /api/containers/:id` - Delete container
- `POST /api/containers/:id/start` - Start container
- `POST /api/containers/:id/stop` - Stop container
- `POST /api/containers/:id/restart` - Restart container
- `GET /api/containers/:id/logs` - Get container logs

### WebSocket Endpoints
- `WS /api/ws/nodes` - Node agent WebSocket connection

## Authentication

The API uses **Better-Auth** for authentication with support for:

- **Email/Password** authentication
- **GitHub OAuth** (optional)
- **Discord OAuth** (optional)
- **JWT tokens** for API access
- **Session management**

### API Authentication

Include the authentication token in the `Authorization` header:
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:3000/api/users
```

### Session Authentication

For web clients, use session cookies (automatically handled by Better-Auth).

## Node Agents

Remote node agents connect to the backend via WebSocket to execute Docker commands. See [AGENTS.MD](AGENTS.MD) for complete agent setup instructions.

### Node Registration

1. **Register a node** via the REST API:
   ```bash
   curl -X POST http://localhost:3000/api/nodes \
     -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"name": "node-01", "description": "Production node"}'
   ```

2. **Get the node token** from the response:
   ```json
   {
     "id": "uuid",
     "name": "node-01",
     "token": "eyJhbGciOiJIUzI1NiIs...",
     "createdAt": "2024-01-01T00:00:00Z"
   }
   ```

3. **Configure the agent** with the token and start it on the remote node.

## Development

### Database Migrations

Generate and run migrations using Drizzle:

```bash
# Generate migration from schema changes
bunx drizzle-kit generate

# Run migrations
bunx drizzle-kit migrate

# Push schema to database (development only)
bunx drizzle-kit push
```

### Database Schema

The database schema is defined in `src/database/schema.ts` and includes:
- Users, roles, and permissions for RBAC
- Nodes and clusters for infrastructure management
- Eggs (container templates) for deployment
- Containers for runtime management
- Audit logs for security tracking

### Testing API Endpoints

Example curl commands for testing:

```bash
# Login to get JWT token
curl -X POST http://localhost:3000/api/auth/sign-in \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@lormas.com", "password": "ChangeMe123!"}'

# Create a new node (replace TOKEN with actual JWT)
curl -X POST http://localhost:3000/api/nodes \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "test-node", "description": "Test node"}'

# List all containers
curl -X GET http://localhost:3000/api/containers \
  -H "Authorization: Bearer TOKEN"
```

### Project Structure

```
backend/
├── src/
│   ├── database/          # Database setup, schema, migrations
│   ├── libs/
│   │   ├── auth/          # Better-Auth configuration
│   │   └── websocket.ts   # WebSocket handler and utilities
│   ├── middlewares/       # Authentication and permission middleware
│   ├── routes/            # API route handlers
│   ├── types/
│   │   ├── index.ts       # Main type exports
│   │   └── websocket/     # WebSocket message types and schemas
│   │       ├── index.ts   # WebSocket type exports
│   │       ├── types.ts   # WebSocket type definitions
│   │       └── schemas.ts # TypeBox validation schemas
│   └── utils/
│       ├── logger.ts      # Centralized Pino-style logger
│       ├── migration.ts   # HA migration utilities
│       └── index.ts       # Utility exports
├── drizzle.config.ts      # Drizzle configuration
└── package.json           # Dependencies and scripts
```

## Security

- **JWT Authentication** with configurable expiration
- **Role-Based Access Control (RBAC)** for fine-grained permissions
- **OAuth Integration** for social login
- **Token Rotation** for node agents
- **Audit Logging** for security tracking
- **HTTPS Support** for production deployments

## Troubleshooting

### Common Issues

**Database Connection Errors**
- Verify `DATABASE_URL` is correct
- Ensure PostgreSQL is running and accessible
- Check database user permissions

**Authentication Issues**
- Verify `BETTER_AUTH_SECRET` is set
- Check OAuth app configurations if using social login
- Ensure JWT tokens are properly formatted

**Node Agent Connection Issues**
- Verify WebSocket endpoint is accessible
- Check node token validity
- Ensure agent has Docker permissions

### Debug Mode

Enable debug logging by setting the `LOG_LEVEL` environment variable:
```env
LOG_LEVEL=debug  # Shows debug, info, warn, error
LOG_LEVEL=trace  # Shows all log levels including trace
```

The logger provides structured output with consistent formatting across all components.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.