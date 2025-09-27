import { t } from "elysia";

// TypeBox schemas for WebSocket message validation

export const EggConfigSchema = t.Object({
  image: t.String(),
  ports: t.Optional(t.Array(t.Object({
    host: t.Number(),
    container: t.Number(),
  }))),
  volumes: t.Optional(t.Array(t.Object({
    host: t.String(),
    container: t.String(),
  }))),
  startupCommand: t.Optional(t.String()),
  envVars: t.Optional(t.Record(t.String(), t.String())),
});

export const ResourceConfigSchema = t.Object({
  cpu: t.Optional(t.Number()),
  memory: t.Optional(t.String()),
  disk: t.Optional(t.String()),
});

export const EnvironmentConfigSchema = t.Record(t.String(), t.String());

export const CommandResultSchema = t.Object({
  containerId: t.Optional(t.String()),
  message: t.Optional(t.String()),
  logs: t.Optional(t.Array(t.String())),
  action: t.Optional(t.String()),
});

export const CommandMessageSchema = t.Object({
  type: t.Literal('command'),
  id: t.Optional(t.String()),
  action: t.Union([
    t.Literal('create'),
    t.Literal('start'),
    t.Literal('stop'),
    t.Literal('restart'),
    t.Literal('delete'),
    t.Literal('logs'),
    t.Literal('stdin')
  ]),
  containerId: t.String(),
  eggConfig: t.Optional(EggConfigSchema),
  resources: t.Optional(ResourceConfigSchema),
  environment: t.Optional(EnvironmentConfigSchema),
  lines: t.Optional(t.Number()),
  input: t.Optional(t.String()),
});

export const CommandResultMessageSchema = t.Object({
  type: t.Literal('command_result'),
  commandId: t.String(),
  status: t.Union([
    t.Literal('success'),
    t.Literal('error')
  ]),
  result: t.Optional(CommandResultSchema),
  error: t.Optional(t.String()),
  logs: t.Optional(t.Array(t.String())),
});

export const AgentIdentifyMessageSchema = t.Object({
  type: t.Literal('agent_identify'),
  nodeName: t.String(),
  version: t.String(),
});

export const HeartbeatMessageSchema = t.Object({
  type: t.Literal('heartbeat'),
  nodeId: t.String(),
  resources: t.Object({
    cpu: t.Number(),
    memory: t.String(),
  }),
  timestamp: t.String(),
});

export const PingMessageSchema = t.Object({
  type: t.Literal('ping'),
});

export const PongMessageSchema = t.Object({
  type: t.Literal('pong'),
});

export const StdinMessageSchema = t.Object({
  type: t.Literal('stdin'),
  id: t.String(),
  containerId: t.String(),
  input: t.String(),
});

export const StdinResultSchema = t.Object({
  type: t.Literal('stdin_result'),
  commandId: t.String(),
  status: t.Union([
    t.Literal('success'),
    t.Literal('error')
  ]),
  output: t.Optional(t.String()),
  error: t.Optional(t.String()),
});