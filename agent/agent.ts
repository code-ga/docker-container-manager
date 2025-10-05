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
  input?: string;
  message?: string;
}

// Command execution result interface
interface CommandResultData {
  containerId?: string;
  message?: string;
  logs?: string[];
  output?: string;
}

// Error interface for better error handling
interface DockerError extends Error {
  statusCode?: string | number;
  json?: {
    message: string;
  };
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
  type: 'command_result' | 'stdin_result';
  commandId: string;
  status: 'success' | 'error';
  result?: CommandResultData;
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

interface DockerResult {
  stdout: string;
  stderr?: string;
}

// Logging utility
interface LogData {
  [key: string]: string | number | boolean | null | undefined | string[] | number[] | Record<string, unknown>;
}

function log(level: string, message: string, data: LogData = {}): void {
  if (LOG_LEVEL === 'debug' || (LOG_LEVEL === 'info' && level !== 'debug')) {
    console.log(`[${new Date().toISOString()}] [${level.toUpperCase()}] ${message}`, data);
  }
}

class NodeAgent {
  private ws: WebSocket | null = null;
  private reconnectAttempts: number = 0;
  private readonly maxReconnectAttempts: number = 10;
  private readonly reconnectDelay: number = 5000;
  private readonly pendingCommands: Map<string, Message> = new Map();
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
        const rawData = data.toString();
        log('debug', 'Received raw message', { rawData, dataType: typeof data });
        const message: Message = JSON.parse(rawData);
        log('debug', 'Parsed message', { type: message.type });
        await this.handleMessage(message);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        log('error', 'Failed to parse message', { error: errorMessage, rawData: data.toString() });
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
      const messageStr = JSON.stringify(message);
      log('debug', 'Sending message', { type: message.type, messageStr });
      this.ws.send(messageStr);
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
      case 'error':
        log('error', 'Server error message', { message: message.message });
        break;
      default:
        log('warn', 'Unknown message type', { type: message.type });
    }
  }

  private async executeCommand(command: Message): Promise<void> {
    const commandId = command.id || uuidv4();

    try {
      log('info', `Executing command: ${command.action}`, { commandId, containerId: command.containerId });

      let result: CommandResultData;

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
        case 'stdin':
          result = await this.sendStdinToContainer(command);
          log('info', 'Stdin input sent to container', { commandId, containerId: command.containerId, inputLength: command.input?.length || 0 });

          // Send stdin-specific result
          this.send({
            type: 'stdin_result',
            commandId,
            status: 'success',
            result
          });
          return;
        default:
          throw new Error(`Unknown action: ${command.action}`);
      }

      this.send({
        type: 'command_result',
        commandId,
        status: 'success',
        result
      });

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const statusCode = (error as DockerError)?.statusCode || 'unknown';
      const dockerError = (error as DockerError)?.json?.message || 'No JSON details';

      log('error', `Docker operation failed: ${errorMessage}`, {
        action: command.action,
        containerId: command.containerId,
        statusCode,
        dockerError,
        commandId
      });

      // Use stdin_result type for stdin action errors
      const resultType = command.action === 'stdin' ? 'stdin_result' : 'command_result';

      this.send({
        type: resultType,
        commandId,
        status: 'error',
        error: `${errorMessage} (Status: ${statusCode})`
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
      interface DockerContainerConfig {
        Image: string;
        name: string;
        Tty: boolean;
        HostConfig: Record<string, unknown>;
        Env?: string[];
        ExposedPorts?: Record<string, Record<string, never>>;
        [key: string]: unknown;
      }

      const containerConfig: DockerContainerConfig = {
        Image: eggConfig.image,
        name: command.containerId,
        Tty: true,
        HostConfig: {},
        ExposedPorts: {},
      };

      // Type assertion for HostConfig properties that we know will be set
      const hostConfig = containerConfig.HostConfig as Record<string, unknown>;

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
        const portBindings: Record<string, Array<{ HostPort: string }>> = {};
        const exposedPorts = containerConfig.ExposedPorts!;

        eggConfig.ports.forEach(port => {
          const portKey = `${port.container}/tcp`;
          exposedPorts[portKey] = {};
          portBindings[portKey] = [{ HostPort: port.host.toString() }];
        });

        hostConfig.PortBindings = portBindings;
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const statusCode = (error as DockerError)?.statusCode || 'unknown';
      const dockerError = (error as DockerError)?.json?.message || 'No JSON details';

      log('error', `Failed to create container: ${errorMessage}`, {
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const statusCode = (error as DockerError)?.statusCode || 'unknown';
      const dockerError = (error as DockerError)?.json?.message || 'No JSON details';

      log('error', `Failed to start container: ${errorMessage}`, {
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const statusCode = (error as DockerError)?.statusCode || 'unknown';
      const dockerError = (error as DockerError)?.json?.message || 'No JSON details';

      log('error', `Failed to stop container: ${errorMessage}`, {
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const statusCode = (error as DockerError)?.statusCode || 'unknown';
      const dockerError = (error as DockerError)?.json?.message || 'No JSON details';

      log('error', `Failed to restart container: ${errorMessage}`, {
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const statusCode = (error as DockerError)?.statusCode || 'unknown';
      const dockerError = (error as DockerError)?.json?.message || 'No JSON details';

      log('error', `Failed to delete container: ${errorMessage}`, {
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const statusCode = (error as DockerError)?.statusCode || 'unknown';
      const dockerError = (error as DockerError)?.json?.message || 'No JSON details';

      log('error', `Failed to get container logs: ${errorMessage}`, {
        containerId,
        lines,
        statusCode,
        dockerError
      });

      throw error;
    }
  }

  private async sendStdinToContainer(command: Message): Promise<{ output: string }> {
    const { containerId, input } = command;
    if (!containerId) {
      throw new Error('containerId is required for stdin action');
    }
    if (!input) {
      throw new Error('input is required for stdin action');
    }

    try {
      const container = this.docker.getContainer(containerId);

      // Check if container is running
      const containerInfo = await container.inspect();
      if (!containerInfo.State.Running) {
        throw new Error('Container is not running');
      }

      log('debug', 'Attaching to container for stdin', { containerId });

      // Attach to container with stdin/stdout/stderr streams
      const attachOptions = {
        stream: true,
        stdin: true,
        stdout: true,
        stderr: true
      };

      const stream = await container.attach(attachOptions);

      let collectedOutput = '';
      const outputLines: string[] = [];

      // Listen for output data
      stream.on('data', (chunk: Buffer) => {
        const chunkStr = chunk.toString();
        collectedOutput += chunkStr;
        outputLines.push(...chunkStr.split('\n').filter(line => line.trim()));
      });

      // Write input to stdin
      log('debug', 'Writing input to container stdin', { containerId, inputLength: input.length });
      stream.write(input + '\n');

      // Wait a bit for command execution and output collection
      await new Promise(resolve => setTimeout(resolve, 2000));

      // End the stdin stream
      stream.end();

      log('debug', 'Stdin stream ended', { containerId, outputLength: collectedOutput.length });

      return { output: collectedOutput };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const statusCode = (error as DockerError)?.statusCode || 'unknown';
      const dockerError = (error as DockerError)?.json?.message || 'No JSON details';

      log('error', `Failed to send stdin to container: ${errorMessage}`, {
        containerId,
        inputLength: input?.length || 0,
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