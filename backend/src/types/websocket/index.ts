// Export all TypeBox schemas
export {
  EggConfigSchema,
  ResourceConfigSchema,
  EnvironmentConfigSchema,
  CommandResultSchema,
  CommandMessageSchema,
  CommandResultMessageSchema,
  AgentIdentifyMessageSchema,
  HeartbeatMessageSchema,
  PingMessageSchema,
  PongMessageSchema,
  StdinMessageSchema,
  StdinResultSchema,
  ErrorMessageSchema,
} from './schemas';

// Export all TypeScript interfaces
export type {
  WebSocketMessage,
  EggConfig,
  ResourceConfig,
  EnvironmentConfig,
  CommandResult,
  CommandMessage,
  CommandResultMessage,
  AgentIdentifyMessage,
  HeartbeatMessage,
  StdinMessage,
  StdinResult,
  ErrorMessage,
} from './types';