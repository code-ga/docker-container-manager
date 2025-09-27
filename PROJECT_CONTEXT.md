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
- **WebSocket**: Native WebSocket support with TypeBox validation for real-time agent communication
- **Logging**: Centralized Pino-style logger with structured output and configurable levels
- **Type Safety**: Comprehensive TypeScript integration with TypeBox runtime validation
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

### Type System
The backend implements a comprehensive type system for enhanced safety and developer experience:
- **WebSocket Types**: `backend/src/types/websocket/` - Type-safe message definitions and validation schemas
- **Core Types**: `backend/src/types/index.ts` - Main type exports and interfaces
- **TypeBox Validation**: Runtime validation using TypeBox schemas for all API endpoints
- **Elimination of 'any'**: Strict TypeScript configuration with comprehensive type coverage

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
// Enhanced WebSocket message types with TypeBox validation
import { Type } from '@sinclair/typebox';

export const CommandMessageSchema = Type.Object({
  type: Type.Literal('command'),
  id: Type.String(),
  action: Type.Union([
    Type.Literal('create'),
    Type.Literal('start'),
    Type.Literal('stop'),
    Type.Literal('restart'),
    Type.Literal('delete'),
    Type.Literal('logs')
  ]),
  containerId: Type.String(),
  eggConfig: Type.Optional(EggConfigSchema),
  resources: Type.Optional(ResourceSchema),
  environment: Type.Optional(Type.Record(Type.String(), Type.String()))
});

// Type-safe WebSocket handler with validation
app.ws('/api/ws/nodes', {
  body: CommandMessageSchema,
  response: CommandResultSchema,
  // ... handler implementation
});
```

### Agent Script
Lightweight Bun.js agent that:
- Connects to server via WebSocket with JWT authentication
- Executes Docker commands via child_process
- Streams container logs and status updates
- Handles container lifecycle operations (create, start, stop, restart, delete)
- Provides real-time feedback to the central server
- Uses centralized Pino-style logger for consistent structured logging
- Validates all WebSocket messages using TypeBox schemas

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