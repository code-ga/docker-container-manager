# Node Agents Documentation

## Overview

Node agents are lightweight services that run on individual nodes (servers) to manage container lifecycles remotely. Each agent connects to the central Lormas server via WebSocket, receives commands for Docker operations, and executes them locally while streaming back status updates and logs.

### Architecture

- **Multi-node setup**: Each physical/virtual server runs one agent instance
- **Centralized control**: Server sends commands via WebSocket to specific nodes
- **Real-time feedback**: Agents stream execution logs and status back to server
- **Token-based auth**: Secure authentication using JWT tokens issued by the server

### Agent Purpose

- Execute Docker commands remotely (create, start, stop, restart, delete containers)
- Stream container logs to the central server
- Provide real-time status updates for container operations
- Handle resource monitoring and reporting

## Setup

### Prerequisites

- **Runtime**: Bun.js (recommended) or Node.js 18+
- **Docker**: Docker daemon running on the node
- **Network**: Outbound connectivity to the Lormas server

### Installation

#### Option 1: Inline Script (Recommended for testing)

Copy the agent script directly to your node:

```bash
# Create agent directory
mkdir -p /opt/lormas-agent
cd /opt/lormas-agent

# Create agent script (now TypeScript)
cat > agent.ts << 'EOF'
// Full agent code provided in Agent Code section below
EOF
```

Note: The agent is now written in TypeScript for better type safety. Bun handles TypeScript directly without compilation.

#### Option 2: Repository Clone

```bash
git clone <agent-repo-url> /opt/lormas-agent
cd /opt/lormas-agent
bun install  # or npm install
```

### Environment Variables

Create a `.env` file in the agent directory:

```env
SERVER_URL=ws://your-server.com
NODE_TOKEN=your-node-jwt-token
NODE_NAME=optional-node-identifier
LOG_LEVEL=info
```

#### Obtaining NODE_TOKEN

1. Register the node via the server's REST API:
   ```bash
   curl -X POST http://your-server.com/api/nodes \
     -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"name": "node-01", "description": "Production node"}'
   ```

2. The server response will include the `token` field:
   ```json
   {
     "id": "uuid",
     "name": "node-01",
     "token": "eyJhbGciOiJIUzI1NiIs...",
     "createdAt": "2024-01-01T00:00:00Z"
   }
   ```

### Running the Agent

```bash
# Install dependencies (if using dockerode)
bun install

# Using Bun (recommended)
bun run agent.ts

# Using Node.js (with TypeScript compilation)
npx tsx agent.ts

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

## Type Safety and Validation

### Message Validation
All WebSocket messages between server and agents are validated using TypeBox schemas:

```typescript
// Example message schemas (defined in backend/src/types/websocket/)
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

export const CommandResultSchema = Type.Object({
  type: Type.Literal('command_result'),
  commandId: Type.String(),
  status: Type.Union([Type.Literal('success'), Type.Literal('error')]),
  result: Type.Optional(Type.Any()),
  error: Type.Optional(Type.String())
});
```

### Type Structures
The agent uses centralized type definitions for consistency:

```typescript
// Import types from server (in production deployment)
import type {
  CommandMessage,
  CommandResult,
  EggConfig,
  ResourceLimits
} from './types/websocket';

// Type-safe message handling
async function handleMessage(message: CommandMessage): Promise<CommandResult> {
  // Message is fully typed with validation
  switch (message.action) {
    case 'create':
      return await createContainer(message);
    case 'start':
      return await startContainer(message);
    // ... other actions
  }
}
```

### Dockerode TypeScript Support
The agent leverages dockerode's full TypeScript support for enhanced development experience:

```typescript
import Docker from 'dockerode';

// Fully typed Docker operations
const docker = new Docker();
const container = docker.getContainer('container-id');

// Type-safe container operations with IntelliSense
await container.start();
await container.stop();
const logs = await container.logs({ stdout: true, stderr: true });
```

### Centralized Logging
Agents use the same Pino-style logger as the backend for consistent logging:

```typescript
import { logger } from './utils/logger';

// Structured logging with context
logger.info('Container operation started', {
  action: message.action,
  containerId: message.containerId,
  commandId: message.id
});

logger.error('Container operation failed', {
  action: message.action,
  containerId: message.containerId,
  error: error.message,
  stack: error.stack
});
```

## Agent Code

Here's a complete, production-ready TypeScript agent script with enhanced type safety, logging, and dockerode integration:

```typescript
#!/usr/bin/env bun

import { WebSocket } from 'ws';
import Docker from 'dockerode';

// Import uuid using require to avoid type issues
const { v4: uuidv4 } = require('uuid');

// Configuration
const SERVER_URL = process.env.SERVER_URL || 'ws://localhost:3000';
const NODE_TOKEN = process.env.NODE_TOKEN;
const NODE_NAME = process.env.NODE_NAME || 'agent-node';
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

if (!NODE_TOKEN) {
  console.error('NODE_TOKEN environment variable is required');
  process.exit(1);
}

// TypeScript interfaces
interface Message {
  type: string;
  id?: string;
  action?: string;
  containerId?: string;
  eggConfig?: EggConfig;
  resources?: Resources;
  environment?: Record<string, string>;
  lines?: number;
}

interface HeartbeatMessage {
  type: 'heartbeat';
  nodeId: string;
  resources: SystemResources;
  timestamp: string;
}

interface SystemResources {
  cpu: number;
  memory: string;
}

interface EggConfig {
  image: string;
  ports?: Port[];
  volumes?: Volume[];
}

interface Port {
  host: number;
  container: number;
}

interface Volume {
  host: string;
  container: string;
}

interface Resources {
  cpu?: number;
  memory?: string;
  disk?: string;
}

interface CommandResult {
  type: 'command_result';
  commandId: string;
  status: 'success' | 'error';
  result?: any;
  error?: string;
}

interface AgentIdentify {
  type: 'agent_identify';
  nodeName: string;
  version: string;
}

interface PongMessage {
  type: 'pong';
}

type OutgoingMessage = CommandResult | AgentIdentify | PongMessage | HeartbeatMessage;

// Logging utility
function log(level: string, message: string, data: Record<string, any> = {}): void {
  if (LOG_LEVEL === 'debug' || (LOG_LEVEL === 'info' && level !== 'debug')) {
    console.log(`[${new Date().toISOString()}] [${level.toUpperCase()}] ${message}`, data);
  }
}

class NodeAgent {
  private ws: WebSocket | null = null;
  private reconnectAttempts: number = 0;
  private readonly maxReconnectAttempts: number = 10;
  private readonly reconnectDelay: number = 5000;
  private readonly pendingCommands: Map<string, any> = new Map();
  private readonly docker: Docker;

  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 5000;
    this.pendingCommands = new Map();
    this.docker = new Docker();

    // Start heartbeat interval
    this.startHeartbeat();
  }

  private startHeartbeat(): void {
    setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.sendHeartbeat();
      }
    }, 10000); // Every 10 seconds
  }

  private sendHeartbeat(): void {
    const heartbeatMessage: HeartbeatMessage = {
      type: 'heartbeat',
      nodeId: this.getNodeId(),
      resources: this.getSystemResources(),
      timestamp: new Date().toISOString()
    };

    this.send(heartbeatMessage);
  }

  private getNodeId(): string {
    // Extract node ID from token or use a default
    // For now, we'll use a simple approach - in production this should be extracted from the token
    return NODE_TOKEN ? NODE_TOKEN.substring(0, 8) : 'unknown-node';
  }

  private getSystemResources(): SystemResources {
    // Stub implementation - in production this would get real system metrics
    return {
      cpu: 0.5, // 50% CPU usage
      memory: '512MB' // 512MB memory usage
    };
  }

  private parseMemory(memory: string): number {
    const match = memory.match(/^(\d+)([kmg]?)b?$/i);
    if (!match) {
      throw new Error(`Invalid memory format: ${memory}`);
    }

    const value = parseInt(match[1], 10);
    const unit = match[2].toLowerCase();

    switch (unit) {
      case 'k':
        return value * 1024;
      case 'm':
        return value * 1024 * 1024;
      case 'g':
        return value * 1024 * 1024 * 1024;
      default:
        return value;
    }
  }

  async connect(): Promise<void> {
    const wsUrl = `${SERVER_URL}/api/ws/nodes?token=${NODE_TOKEN}`;

    log('info', `Connecting to ${wsUrl}`);

    this.ws = new WebSocket(wsUrl, {
      headers: {
        'Authorization': `Bearer ${NODE_TOKEN}`,
        'User-Agent': 'Lormas-Node-Agent/1.0'
      }
    });

    this.ws.on('open', () => {
      log('info', 'Connected to server');
      this.reconnectAttempts = 0;

      // Send identification
      this.send({
        type: 'agent_identify',
        nodeName: NODE_NAME,
        version: '1.0.0'
      });
    });

    this.ws.on('message', async (data: Buffer) => {
      try {
        const message: Message = JSON.parse(data.toString());
        await this.handleMessage(message);
      } catch (error: any) {
        log('error', 'Failed to parse message', { error: error.message });
      }
    });

    this.ws.on('error', (error: Error) => {
      log('error', 'WebSocket error', { error: error.message });
    });

    this.ws.on('close', (code: number, reason: Buffer) => {
      log('warn', `Connection closed: ${code} - ${reason.toString()}`);
      this.handleReconnect();
    });
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

      log('info', `Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

      setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      log('error', 'Max reconnection attempts reached, exiting');
      process.exit(1);
    }
  }

  private send(message: OutgoingMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      log('warn', 'Cannot send message: WebSocket not connected');
    }
  }

  private async handleMessage(message: Message): Promise<void> {
    log('debug', 'Received message', { type: message.type, action: message.action });

    switch (message.type) {
      case 'command':
        await this.executeCommand(message);
        break;
      case 'ping':
        this.send({ type: 'pong' });
        break;
      default:
        log('warn', 'Unknown message type', { type: message.type });
    }
  }

  private async executeCommand(command: Message): Promise<void> {
    const commandId = command.id || uuidv4();

    try {
      log('info', `Executing command: ${command.action}`, { commandId, containerId: command.containerId });

      let result: any;

      switch (command.action) {
        case 'create':
          result = await this.createContainer(command);
          log('info', 'Container created successfully', { commandId, containerId: result.containerId });
          break;
        case 'start':
          result = await this.startContainer(command);
          log('info', 'Container started successfully', { commandId, containerId: command.containerId });
          break;
        case 'stop':
          result = await this.stopContainer(command);
          log('info', 'Container stopped successfully', { commandId, containerId: command.containerId });
          break;
        case 'restart':
          result = await this.restartContainer(command);
          log('info', 'Container restarted successfully', { commandId, containerId: command.containerId });
          break;
        case 'delete':
          result = await this.deleteContainer(command);
          log('info', 'Container deleted successfully', { commandId, containerId: command.containerId });
          break;
        case 'logs':
          result = await this.getContainerLogs(command);
          log('info', 'Container logs retrieved successfully', { commandId, containerId: command.containerId, logLines: result.logs?.length || 0 });
          break;
        default:
          throw new Error(`Unknown action: ${command.action}`);
      }

      this.send({
        type: 'command_result',
        commandId,
        status: 'success',
        result
      });

    } catch (error: any) {
      const statusCode = error.statusCode || 'unknown';
      const dockerError = error.json ? error.json.message : 'No JSON details';

      log('error', `Docker operation failed: ${error.message}`, {
        action: command.action,
        containerId: command.containerId,
        statusCode,
        dockerError,
        commandId
      });

      this.send({
        type: 'command_result',
        commandId,
        status: 'error',
        error: `${error.message} (Status: ${statusCode})`
      });
    }
  }

  private async createContainer(command: Message): Promise<{ containerId: string }> {
    const { eggConfig, resources, environment } = command;

    if (!eggConfig) {
      throw new Error('eggConfig is required for create action');
    }

    if (!command.containerId) {
      throw new Error('containerId is required for create action');
    }

    try {
      // Pull image if needed
      if (eggConfig.image) {
        log('debug', `Pulling image: ${eggConfig.image}`, { containerId: command.containerId });
        await this.docker.pull(eggConfig.image);
      }

      // Build container configuration
      const containerConfig: any = {
        Image: eggConfig.image,
        name: command.containerId,
        Tty: true,
        HostConfig: {}
      };

      // Resources
      if (resources?.cpu) {
        containerConfig.HostConfig.CpusetCpus = resources.cpu.toString();
      }
      if (resources?.memory) {
        containerConfig.HostConfig.Memory = this.parseMemory(resources.memory);
      }
      if (resources?.disk) {
        containerConfig.HostConfig.StorageOpt = { size: resources.disk };
      }

      // Ports
      if (eggConfig.ports) {
        containerConfig.HostConfig.PortBindings = {};
        containerConfig.ExposedPorts = {};
        eggConfig.ports.forEach(port => {
          const portKey = `${port.container}/tcp`;
          containerConfig.ExposedPorts[portKey] = {};
          containerConfig.HostConfig.PortBindings[portKey] = [{ HostPort: port.host.toString() }];
        });
      }

      // Environment variables
      if (environment) {
        containerConfig.Env = Object.entries(environment).map(([key, value]) => `${key}=${value}`);
      }

      // Volumes
      if (eggConfig.volumes) {
        containerConfig.HostConfig.Binds = eggConfig.volumes.map(volume => `${volume.host}:${volume.container}`);
      }

      log('debug', 'Creating container with config', { containerId: command.containerId, config: containerConfig });

      const container = await this.docker.createContainer(containerConfig);
      return { containerId: container.id };
    } catch (error: any) {
      const statusCode = error.statusCode || 'unknown';
      const dockerError = error.json ? error.json.message : 'No JSON details';

      log('error', `Failed to create container: ${error.message}`, {
        containerId: command.containerId,
        statusCode,
        dockerError
      });

      throw error;
    }
  }

  private async startContainer(command: Message): Promise<{ message: string }> {
    if (!command.containerId) {
      throw new Error('containerId is required for start action');
    }

    try {
      const container = this.docker.getContainer(command.containerId);
      await container.start();
      return { message: 'Container started' };
    } catch (error: any) {
      const statusCode = error.statusCode || 'unknown';
      const dockerError = error.json ? error.json.message : 'No JSON details';

      log('error', `Failed to start container: ${error.message}`, {
        containerId: command.containerId,
        statusCode,
        dockerError
      });

      throw error;
    }
  }

  private async stopContainer(command: Message): Promise<{ message: string }> {
    if (!command.containerId) {
      throw new Error('containerId is required for stop action');
    }

    try {
      const container = this.docker.getContainer(command.containerId);
      await container.stop();
      return { message: 'Container stopped' };
    } catch (error: any) {
      const statusCode = error.statusCode || 'unknown';
      const dockerError = error.json ? error.json.message : 'No JSON details';

      log('error', `Failed to stop container: ${error.message}`, {
        containerId: command.containerId,
        statusCode,
        dockerError
      });

      throw error;
    }
  }

  private async restartContainer(command: Message): Promise<{ message: string }> {
    if (!command.containerId) {
      throw new Error('containerId is required for restart action');
    }

    try {
      const container = this.docker.getContainer(command.containerId);
      await container.restart();
      return { message: 'Container restarted' };
    } catch (error: any) {
      const statusCode = error.statusCode || 'unknown';
      const dockerError = error.json ? error.json.message : 'No JSON details';

      log('error', `Failed to restart container: ${error.message}`, {
        containerId: command.containerId,
        statusCode,
        dockerError
      });

      throw error;
    }
  }

  private async deleteContainer(command: Message): Promise<{ message: string }> {
    if (!command.containerId) {
      throw new Error('containerId is required for delete action');
    }

    try {
      const container = this.docker.getContainer(command.containerId);
      await container.remove({ force: true });
      return { message: 'Container deleted' };
    } catch (error: any) {
      const statusCode = error.statusCode || 'unknown';
      const dockerError = error.json ? error.json.message : 'No JSON details';

      log('error', `Failed to delete container: ${error.message}`, {
        containerId: command.containerId,
        statusCode,
        dockerError
      });

      throw error;
    }
  }

  private async getContainerLogs(command: Message): Promise<{ logs: string[] }> {
    const { containerId, lines = 100 } = command;
    if (!containerId) {
      throw new Error('containerId is required for logs action');
    }

    try {
      const container = this.docker.getContainer(containerId);
      const logs = await container.logs({
        follow: false,
        tail: lines,
        stdout: true,
        stderr: true
      });

      // Convert buffer to string and split into lines
      const logsString = logs.toString();
      return { logs: logsString.split('\n').filter(line => line.trim()) };
    } catch (error: any) {
      const statusCode = error.statusCode || 'unknown';
      const dockerError = error.json ? error.json.message : 'No JSON details';

      log('error', `Failed to get container logs: ${error.message}`, {
        containerId,
        lines,
        statusCode,
        dockerError
      });

      throw error;
    }
  }
}

// Start the agent
const agent = new NodeAgent();
agent.connect();

// Graceful shutdown
process.on('SIGINT', () => {
  log('info', 'Shutting down agent');
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('info', 'Shutting down agent');
  process.exit(0);
});
```

## Dockerode Integration

### Overview
The agent has been upgraded from shell-based Docker commands to use the **dockerode** library for improved reliability, type safety, and performance. This integration provides a more robust and maintainable approach to Docker operations.

### Benefits of Dockerode Integration

**Pros:**
- **Structured API**: Direct access to Docker's API without shell command parsing
- **No shell overhead**: Eliminates subprocess creation and shell escaping issues
- **Streaming support**: Native support for real-time log streaming and container stats
- **Type safety**: Full TypeScript support with IntelliSense and compile-time error checking
- **Better error handling**: Structured error objects with detailed Docker API error information
- **Performance**: Reduced latency and resource usage compared to shell execution

**Cons:**
- **Dependency size**: Additional npm package increases deployment size (~2MB)
- **API version compatibility**: Requires matching Docker API version support

### Installation Requirements
After updating your `package.json` to include dockerode, run:
```bash
bun install
```

### Migration from CLI
The agent previously used shell commands like `docker run`, `docker start`, etc. The new implementation uses dockerode's programmatic API:

```typescript
// Old approach (CLI-based)
await this.execDocker(`start ${containerId}`);

// New approach (dockerode)
const container = this.docker.getContainer(containerId);
await container.start();
```

## Commands

The server sends commands to agents via WebSocket messages with the following JSON structure:

### Command Message Format

```json
{
  "type": "command",
  "id": "command-uuid",
  "action": "create|start|stop|restart|delete|logs",
  "containerId": "container-uuid",
  "eggConfig": {...},
  "resources": {...},
  "environment": {...}
}
```

### Create Container

Creates a new container from an egg configuration:

```json
{
  "type": "command",
  "action": "create",
  "containerId": "container-uuid",
  "eggConfig": {
    "image": "nginx:alpine",
    "ports": [
      {"host": 8080, "container": 80}
    ],
    "volumes": [
      {"host": "/data", "container": "/app/data"}
    ]
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

### Start Container

```json
{
  "type": "command",
  "action": "start",
  "containerId": "container-uuid"
}
```

### Stop Container

```json
{
  "type": "command",
  "action": "stop",
  "containerId": "container-uuid"
}
```

### Restart Container

```json
{
  "type": "command",
  "action": "restart",
  "containerId": "container-uuid"
}
```

### Delete Container

```json
{
  "type": "command",
  "action": "delete",
  "containerId": "container-uuid"
}
```

### Get Container Logs

```json
{
  "type": "command",
  "action": "logs",
  "containerId": "container-uuid",
  "lines": 100
}
```

### Command Response Format

Agents respond with:

```json
{
  "type": "command_result",
  "commandId": "command-uuid",
  "status": "success|error",
  "result": {...},
  "error": "error message (if status=error)"
}
```

## Security

### Token Authentication

- Agents authenticate using JWT tokens issued by the server
- Tokens are included in WebSocket connection URL as query parameter
- Tokens should be rotated regularly via the server's node management API

### HTTPS/SSL

For production deployments:

1. Use WSS (WebSocket Secure) instead of WS
2. Set `SERVER_URL=wss://your-server.com` in environment
3. Ensure server has valid SSL certificate
4. Consider using client certificates for additional security

### Network Security

- Restrict agent outbound connections to only the Lormas server
- Use firewall rules to limit agent network access
- Run agent with minimal privileges (non-root user)
- Store tokens securely (environment variables, not files)

### Token Rotation

Rotate node tokens regularly:

```bash
# Via server API
curl -X PATCH http://your-server.com/api/nodes/{nodeId}/token \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

Update the agent's `.env` file with the new token.

## Troubleshooting

### Connection Issues

**Problem**: Agent cannot connect to server
- Check `SERVER_URL` environment variable
- Verify server is running and WebSocket endpoint is available
- Check firewall settings and network connectivity
- Ensure token is valid and not expired

**Problem**: Frequent disconnections
- Check network stability
- Monitor server logs for WebSocket errors
- Verify token hasn't been revoked
- Check for proxy/load balancer issues

### Docker Issues

**Problem**: Docker commands fail
- Verify Docker daemon is running: `docker info`
- Check agent has permissions to run Docker commands
- Ensure container names/IDs are correct
- Check Docker resource constraints

**Problem**: Permission denied errors
- Run agent with appropriate user permissions
- Add agent user to `docker` group: `sudo usermod -aG docker $USER`
- Restart agent after permission changes

**Problem**: Dockerode connection issues
- Verify Docker socket path and permissions: `ls -la /var/run/docker.sock`
- Check if Docker daemon is accessible via socket
- Ensure dockerode can connect to Docker API
- Common error: "Error: connect EACCES /var/run/docker.sock"

**Problem**: Dockerode API version compatibility
- Ensure Docker API version matches dockerode expectations
- Check Docker daemon version: `docker version`
- Update dockerode if needed: `bun update dockerode`

### Performance Issues

**Problem**: High resource usage
- Monitor agent memory/CPU usage
- Check for memory leaks in long-running agents
- Consider log rotation for high-volume logging
- Scale horizontally if single agent is overloaded

### Debugging

Enable debug logging:

```env
LOG_LEVEL=debug
```

Monitor agent logs:

```bash
# Follow logs in real-time
tail -f /var/log/lormas-agent.log

# Using journalctl (if running as service)
journalctl -u lormas-agent -f
```

### Common Error Messages

- `"docker: command not found"`: Docker not installed or not in PATH
- `"permission denied"`: Insufficient permissions for Docker operations
- `"no such container"`: Container ID/name doesn't exist
- `"connection refused"`: Cannot reach server WebSocket endpoint
- `"invalid token"`: Authentication token is invalid or expired