// Legacy interfaces for TypeScript compatibility (can be removed once fully migrated)
export interface WebSocketMessage {
  type: string;
  [key: string]: unknown;
}

export interface EggConfig {
  image: string;
  ports?: Array<{
    host: number;
    container: number;
  }>;
  volumes?: Array<{
    host: string;
    container: string;
  }>;
  startupCommand?: string;
  envVars?: Record<string, string>;
}

export interface ResourceConfig {
  cpu?: number;
  memory?: string;
  disk?: string;
}

export interface EnvironmentConfig {
  [key: string]: string;
}

export interface CommandResult {
  containerId?: string;
  message?: string;
  logs?: string[];
  action?: string;
}

export interface CommandMessage extends WebSocketMessage {
  type: 'command';
  id?: string;
  action: 'create' | 'start' | 'stop' | 'restart' | 'delete' | 'logs' | 'stdin';
  containerId: string;
  eggConfig?: EggConfig;
  resources?: ResourceConfig;
  environment?: EnvironmentConfig;
  lines?: number;
  input?: string;
}

export interface CommandResultMessage extends WebSocketMessage {
  type: 'command_result';
  commandId: string;
  status: 'success' | 'error';
  result?: CommandResult;
  error?: string;
  logs?: string[];
}

export interface AgentIdentifyMessage extends WebSocketMessage {
  type: 'agent_identify';
  nodeName: string;
  version: string;
}

export interface HeartbeatMessage extends WebSocketMessage {
  type: 'heartbeat';
  nodeId: string;
  resources: {
    cpu: number;
    memory: string;
  };
  timestamp: string;
}

export interface StdinMessage extends WebSocketMessage {
  type: 'stdin';
  id: string;
  containerId: string;
  input: string;
}

export interface StdinResult extends WebSocketMessage {
  type: 'stdin_result';
  commandId: string;
  status: 'success' | 'error';
  output?: string;
  error?: string;
}

export interface ErrorMessage extends WebSocketMessage {
  type: 'error';
  message: string;
}