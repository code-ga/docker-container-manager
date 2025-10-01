# Lormas Node Agent

This directory contains the Lormas Node Agent, a lightweight service that runs on individual nodes to manage container lifecycles remotely.

## Overview

The Node Agent connects to the central Lormas server via WebSocket, receives commands for Docker operations, and executes them locally while streaming back status updates and logs.

## Features

- Execute Docker commands remotely (create, start, stop, restart, delete containers)
- Stream container logs to the central server
- Provide real-time status updates for container operations
- Secure authentication using JWT tokens

## Installation

### Prerequisites

- **Runtime**: Bun.js (recommended) or Node.js 18+
- **Docker**: Docker daemon running on the node
- **Network**: Outbound connectivity to the Lormas server

### Setup

1. Copy the agent files to your node:
   ```bash
   mkdir -p /opt/lormas-agent
   cd /opt/lormas-agent
   # Copy agent.ts, package.json, and tsconfig.json from this directory
   ```

2. Install dependencies:
   ```bash
   bun install
   # or
   npm install
   ```

3. Create environment file:
   ```bash
   cat > .env << EOF
   SERVER_URL=ws://your-server.com
   NODE_TOKEN=your-node-jwt-token
   NODE_NAME=optional-node-identifier
   LOG_LEVEL=info
   EOF
   ```

4. Obtain NODE_TOKEN from the server:
   ```bash
   curl -X POST http://your-server.com/api/nodes \
     -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"name": "node-01", "description": "Production node"}'
   ```

## Running the Agent

### TypeScript (Recommended)

```bash
# Using Bun (recommended)
bun run agent.ts

# Using Node.js with TypeScript
npx tsx agent.ts

# Build and run compiled JavaScript
bun run build
node dist/agent.js

# As a service (systemd example)
sudo tee /etc/systemd/system/lormas-agent.service > /dev/null <<EOF
[Unit]
Description=Lormas Node Agent
After=network.target docker.service

[Service]
Type=simple
User=lormas
WorkingDirectory=/opt/lormas-agent
EnvironmentFile=/opt/lormas-agent/.env
ExecStart=/usr/bin/bun run agent.ts
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable lormas-agent
sudo systemctl start lormas-agent
```

### JavaScript (Legacy)

```bash
# Using Bun
bun run agent.js

# Using Node.js
node agent.js
```

## Frontend Integration

Node agents work seamlessly with the Lormas frontend application for comprehensive node and cluster management:

### Node Management via Frontend

The frontend provides a complete interface for managing nodes where agents are deployed:

- **Node Dashboard** (`/dashboard/nodes`): Real-time node status, resource monitoring, and health indicators
- **Cluster Organization** (`/dashboard/clusters`): Group nodes into clusters for logical organization and load balancing
- **Container Distribution**: Automatic container distribution across healthy nodes in clusters
- **Real-time Monitoring**: Live node status updates via WebSocket heartbeats

### High Availability Support

Agents support high availability features managed through the frontend:

- **HA Container Types**: Fault-tolerant containers that automatically migrate on node failure
- **Migration Triggers**: Automatic migration when node heartbeat is lost (>30 seconds)
- **Target Selection**: Intelligent selection of healthy nodes in the same or preferred cluster
- **Migration History**: Track all migration events with timestamps and status

### Agent Status Monitoring

The frontend displays real-time agent information:

- **Connection Status**: WebSocket connection health and uptime
- **Resource Usage**: CPU, memory, and disk utilization
- **Container Count**: Number of containers currently managed by the agent
- **Last Heartbeat**: Timestamp of the last successful heartbeat

### Container Migration

When containers need to migrate between nodes (due to failure or manual trigger):

1. **Frontend Trigger**: Admin initiates migration via `/dashboard/containers`
2. **Agent Coordination**: Source agent stops container, target agent creates identical container
3. **State Transfer**: Container configuration, environment variables, and volumes are preserved
4. **Real-time Updates**: Migration progress shown in frontend with live status updates

## Environment Variables

- `SERVER_URL`: WebSocket URL of the Lormas server (default: ws://localhost:3000)
- `NODE_TOKEN`: JWT token for authentication (required)
- `NODE_NAME`: Optional node identifier (default: agent-node)
- `LOG_LEVEL`: Logging level (debug, info, warn, error) (default: info)

## Security

- Agents authenticate using JWT tokens issued by the server
- Tokens are included in WebSocket connection URL as query parameter
- Use WSS for production deployments
- Run agent with minimal privileges (non-root user)
- Store tokens securely in environment variables

## Troubleshooting

See the main AGENTS.MD file for detailed troubleshooting information.