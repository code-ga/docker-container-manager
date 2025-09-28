import { db } from "../database";
import { table } from "../database/schema";
import { eq, sql, and } from "drizzle-orm";
import { auth } from "../libs/auth/auth";
import { logger } from "../utils/logger";
import {
  LogMessage,
  SubscribeMessage,
  UnsubscribeMessage,
  StdinMessage,
  ClientLogMessage,
  CommandMessageSchema,
  CommandResultMessageSchema,
  AgentIdentifyMessageSchema,
  HeartbeatMessageSchema,
  PingMessageSchema,
  PongMessageSchema,
  StdinMessageSchema,
  StdinResultSchema,
  ErrorMessageSchema,
  WebSocketMessage,
  CommandResult,
  CommandMessage,
  CommandResultMessage,
  AgentIdentifyMessage,
  HeartbeatMessage,
  StdinResult,
  ErrorMessage
} from "../types";
import { Value } from "@sinclair/typebox/value";
import { ServerWebSocket } from "bun";
import { Context } from "elysia";

// Extended WebSocket data type for our application
interface ExtendedWebSocketData extends Context {
  connectionId?: string;
  nodeId?: string;
  userId?: string;
  connectionType?: 'node' | 'client';
}

type ExtendedServerWebSocket = ServerWebSocket<ExtendedWebSocketData>;




class WebSocketManager {
  private connections: Map<string, ExtendedServerWebSocket> = new Map();
  private nodeConnections: Map<string, string> = new Map(); // nodeId -> connectionId
  private clientConnections: Map<string, ExtendedServerWebSocket> = new Map(); // userId -> ws
  private subscriptions: Map<string, Set<string>> = new Map(); // containerId -> Set<userId>
  private pendingCommands: Map<
    string,
    { resolve: (result: CommandResult) => void; reject: (error: Error) => void }
  > = new Map(); // commandId -> promise handlers

  constructor() {
    // Cleanup on process exit
    process.on("SIGINT", () => this.closeAll());
    process.on("SIGTERM", () => this.closeAll());
  }

  // Validate message against schema and return appropriate schema
  private validateMessage(message: any): {
    isValid: boolean;
    schema?: any;
    error?: string;
    shouldClose?: boolean;
  } {
    try {
      switch (message.type) {
        case "command":
          Value.Parse(CommandMessageSchema, message);
          return { isValid: true, schema: CommandMessageSchema };
        case "command_result":
          Value.Parse(CommandResultMessageSchema, message);
          return { isValid: true, schema: CommandResultMessageSchema };
        case "agent_identify":
          Value.Parse(AgentIdentifyMessageSchema, message);
          return { isValid: true, schema: AgentIdentifyMessageSchema };
        case "heartbeat":
          Value.Parse(HeartbeatMessageSchema, message);
          return { isValid: true, schema: HeartbeatMessageSchema };
        case "ping":
          Value.Parse(PingMessageSchema, message);
          return { isValid: true, schema: PingMessageSchema };
        case "pong":
          Value.Parse(PongMessageSchema, message);
          return { isValid: true, schema: PongMessageSchema };
        case "stdin":
          Value.Parse(StdinMessageSchema, message);
          return { isValid: true, schema: StdinMessageSchema };
        case "stdin_result":
          Value.Parse(StdinResultSchema, message);
          return { isValid: true, schema: StdinResultSchema };
        case "error":
          Value.Parse(ErrorMessageSchema, message);
          return { isValid: true, schema: ErrorMessageSchema };
        default:
          return {
            isValid: false,
            error: `Unknown message type: ${message.type}`,
            shouldClose: false,
          };
      }
    } catch (error: any) {
      // For critical schema errors, we may want to close the connection
      const isCriticalError = this.isCriticalValidationError(error, message);
      return {
        isValid: false,
        error: `Invalid message schema: ${error.message}`,
        shouldClose: isCriticalError,
      };
    }
  }

  // Determine if a validation error is critical enough to warrant connection closure
  private isCriticalValidationError(error: any, message: any): boolean {
    // Close connection for agent_identify messages with critical errors
    // as they indicate a fundamental protocol mismatch
    if (message.type === "agent_identify") {
      return true;
    }

    // Close connection for malformed JSON or completely invalid structure
    if (error.message && error.message.includes("Expected")) {
      return true;
    }

    return false;
  }

  // Handle new WebSocket connection
  async handleConnection(
    ws: ExtendedServerWebSocket,
    request: Request
  ): Promise<void> {
    const url = new URL(request.url);
    const token = url.searchParams.get("token");

    if (!token) {
      ws.close(1008, "Missing token");
      return;
    }

    try {
      // Check if this is a node connection (NODE_TOKEN) or client connection (JWT)
      const isNodeToken = token.length > 100; // JWT tokens are typically longer

      if (isNodeToken) {
        await this.handleNodeConnection(ws, token);
      } else {
        await this.handleClientConnection(ws, request);
      }
    } catch (error) {
      logger.error("Error handling WebSocket connection", {
        error: error instanceof Error ? error.message : String(error),
      });
      ws.close(1011, "Internal server error");
    }
  }

  // Handle node agent connections
  private async handleNodeConnection(
    ws: ExtendedServerWebSocket,
    token: string
  ): Promise<void> {
    // Find node by token
    const nodes = await db
      .select()
      .from(table.nodes)
      .where(eq(table.nodes.token, token))
      .limit(1);

    if (!nodes.length) {
      ws.close(1008, "Invalid NODE_TOKEN");
      return;
    }

    const node = nodes[0];
    const connectionId = crypto.randomUUID();

    // Store connection
    this.connections.set(connectionId, ws);
    this.nodeConnections.set(node.id, connectionId);

    // Update node status to online
    await db
      .update(table.nodes)
      .set({
        status: "online",
        updatedAt: sql`now()`,
      })
      .where(eq(table.nodes.id, node.id));

    logger.info(`Node ${node.name} (${node.id}) connected`);

    // Store connection info in Elysia's store
    (ws.data.store as any).connectionId = connectionId;
    (ws.data.store as any).nodeId = node.id;
    (ws.data.store as any).connectionType = 'node';
  }

  // Handle client connections
  private async handleClientConnection(
    ws: ExtendedServerWebSocket,
    request: Request
  ): Promise<void> {
    try {
      // Authenticate client using auth system
      const session = await auth.api.getSession({ headers: request.headers });

      if (!session) {
        ws.close(1008, "Invalid authentication");
        return;
      }

      const userId = session.user.id;
      const connectionId = crypto.randomUUID();

      // Store client connection
      this.connections.set(connectionId, ws);
      this.clientConnections.set(userId, ws);

      logger.info(`Client ${userId} connected`);

      // Store connection info in Elysia's store
      (ws.data.store as any).connectionId = connectionId;
      (ws.data.store as any).userId = userId;
      (ws.data.store as any).connectionType = 'client';
    } catch (error) {
      logger.error("Error handling client WebSocket connection", {
        error: error instanceof Error ? error.message : String(error),
      });
      ws.close(1011, "Internal server error");
    }
  }

  // Handle incoming messages from agents
  public async handleMessage(
    connectionId: string,
    data: string
  ): Promise<void> {
    try {
      const message: WebSocketMessage = JSON.parse(data);

      // Validate message schema
      const validation = this.validateMessage(message);
      if (!validation.isValid) {
        logger.error("Invalid message schema", { error: validation.error });
        this.sendToConnection(connectionId, {
          type: "error",
          message: validation.error || "Invalid message schema",
        });

        // Close connection for critical validation errors
        if (validation.shouldClose) {
          const ws = this.connections.get(connectionId);
          if (ws) {
            ws.close(1007, "Invalid message format");
          }
        }
        return;
      }

      switch (message.type) {
        case "agent_identify":
          await this.handleAgentIdentify(
            connectionId,
            message as AgentIdentifyMessage
          );
          break;
        case "command_result":
          await this.handleCommandResult(message as CommandResultMessage);
          break;
        case "stdin_result":
          await this.handleStdinResult(message as StdinResult);
          break;
        case "heartbeat":
          await this.handleHeartbeat(connectionId, message as HeartbeatMessage);
          break;
        case "ping":
          this.sendToConnection(connectionId, { type: "pong" });
          break;
        case "error":
          // Error messages are just for client notification, no action needed
          logger.info("Error message received from agent", { message: (message as ErrorMessage).message });
          break;
        default:
          logger.warn("Unknown message type", { type: message.type });
          this.sendToConnection(connectionId, {
            type: "error",
            message: `Unknown message type: ${message.type}`,
          });
      }
    } catch (error) {
      logger.error("Error parsing WebSocket message", {
        error: error instanceof Error ? error.message : String(error),
        connectionId,
        rawData: data,
        dataType: typeof data,
        dataLength: data?.length || 0,
      });
      this.sendToConnection(connectionId, {
        type: "error",
        message: "Failed to parse message",
      });
    }
  }

  // Handle incoming messages from clients
  public async handleClientMessage(
    userId: string,
    data: string
  ): Promise<void> {
    try {
      const message: ClientLogMessage = JSON.parse(data);

      // Validate client message schema
      const validation = this.validateClientMessage(message);
      if (!validation.isValid) {
        logger.error("Invalid client message schema", {
          error: validation.error,
        });
        this.sendToClient(userId, {
          type: "error",
          message: validation.error || "Invalid message schema",
        });

        // Close connection for critical validation errors
        if (validation.shouldClose) {
          const ws = this.clientConnections.get(userId);
          if (ws) {
            ws.close(1007, "Invalid message format");
          }
        }
        return;
      }

      switch (message.type) {
        case "subscribe":
          await this.handleSubscribe(userId, message as SubscribeMessage);
          break;
        case "unsubscribe":
          await this.handleUnsubscribe(userId, message as UnsubscribeMessage);
          break;
        case "stdin":
          await this.handleStdin(userId, message as StdinMessage);
          break;
        default:
          logger.warn("Unknown client message type", {
            type: (message as any).type,
          });
          this.sendToClient(userId, {
            type: "error",
            message: `Unknown message type: ${(message as any).type}`,
          });
      }
    } catch (error) {
      logger.error("Error parsing client WebSocket message", {
        error: error instanceof Error ? error.message : String(error),
      });
      this.sendToClient(userId, {
        type: "error",
        message: "Failed to parse message",
      });
    }
  }

  // Validate client message against schema
  private validateClientMessage(message: any): {
    isValid: boolean;
    error?: string;
    shouldClose?: boolean;
  } {
    try {
      switch (message.type) {
        case "subscribe":
          // Basic validation for subscribe message
          if (!message.containerId || typeof message.containerId !== "string") {
            return {
              isValid: false,
              error:
                "Invalid subscribe message: missing or invalid containerId",
              shouldClose: false,
            };
          }
          return { isValid: true };
        case "unsubscribe":
          // Basic validation for unsubscribe message
          if (!message.containerId || typeof message.containerId !== "string") {
            return {
              isValid: false,
              error:
                "Invalid unsubscribe message: missing or invalid containerId",
              shouldClose: false,
            };
          }
          return { isValid: true };
        default:
          return {
            isValid: false,
            error: `Unknown client message type: ${message.type}`,
            shouldClose: false,
          };
      }
    } catch (error: any) {
      // For critical client message errors, close the connection
      const isCriticalError =
        error.message && error.message.includes("Expected");
      return {
        isValid: false,
        error: `Invalid client message schema: ${error.message}`,
        shouldClose: isCriticalError,
      };
    }
  }

  // Handle client subscription to container logs
  private async handleSubscribe(
    userId: string,
    message: SubscribeMessage
  ): Promise<void> {
    try {
      // Check if user has permission to access this container
      const container = await db
        .select()
        .from(table.containers)
        .where(eq(table.containers.uuid, message.containerId))
        .limit(1);

      if (!container.length) {
        this.sendToClient(userId, {
          type: "error",
          message: "Container not found",
        });
        return;
      }

      // Check ownership or assignment
      const hasAccess =
        container[0].userId === userId ||
        (await this.checkContainerAssignment(userId, container[0].id));

      if (!hasAccess) {
        this.sendToClient(userId, {
          type: "error",
          message: "Access denied to container logs",
        });
        return;
      }

      // Add subscription
      if (!this.subscriptions.has(message.containerId)) {
        this.subscriptions.set(message.containerId, new Set());
      }
      this.subscriptions.get(message.containerId)!.add(userId);

      logger.info(
        `User ${userId} subscribed to container ${message.containerId} logs`
      );

      this.sendToClient(userId, {
        type: "subscribed",
        containerId: message.containerId,
      });
    } catch (error) {
      logger.error("Error handling subscription", {
        error: error instanceof Error ? error.message : String(error),
        userId,
        containerId: message.containerId,
      });
      this.sendToClient(userId, {
        type: "error",
        message: "Failed to subscribe to logs",
      });
    }
  }

  // Handle client unsubscription from container logs
  private async handleUnsubscribe(
    userId: string,
    message: UnsubscribeMessage
  ): Promise<void> {
    try {
      if (this.subscriptions.has(message.containerId)) {
        this.subscriptions.get(message.containerId)!.delete(userId);

        // Clean up empty subscription sets
        if (this.subscriptions.get(message.containerId)!.size === 0) {
          this.subscriptions.delete(message.containerId);
        }
      }

      logger.info(
        `User ${userId} unsubscribed from container ${message.containerId} logs`
      );

      this.sendToClient(userId, {
        type: "unsubscribed",
        containerId: message.containerId,
      });
    } catch (error) {
      logger.error("Error handling unsubscription", {
        error: error instanceof Error ? error.message : String(error),
        userId,
        containerId: message.containerId,
      });
    }
  }

  // Handle stdin input from client
  private async handleStdin(
    userId: string,
    message: StdinMessage
  ): Promise<void> {
    try {
      // Check if user has permission to access this container
      const container = await db
        .select()
        .from(table.containers)
        .where(eq(table.containers.uuid, message.containerId))
        .limit(1);

      if (!container.length) {
        this.sendToClient(userId, {
          type: "stdin_result",
          commandId: message.id,
          status: "error",
          error: "Container not found",
        });
        return;
      }

      // Check ownership or assignment
      const hasAccess =
        container[0].userId === userId ||
        (await this.checkContainerAssignment(userId, container[0].id));

      if (!hasAccess) {
        this.sendToClient(userId, {
          type: "stdin_result",
          commandId: message.id,
          status: "error",
          error: "Access denied to container",
        });
        return;
      }

      // Find the node where the container is running
      const nodeId = container[0].nodeId;
      if (!nodeId) {
        this.sendToClient(userId, {
          type: "stdin_result",
          commandId: message.id,
          status: "error",
          error: "Container not assigned to a node",
        });
        return;
      }

      // Check if node is connected
      if (!this.isNodeConnected(nodeId)) {
        this.sendToClient(userId, {
          type: "stdin_result",
          commandId: message.id,
          status: "error",
          error: "Node is not connected",
        });
        return;
      }

      // Forward stdin to the agent
      const commandMessage: CommandMessage = {
        type: 'command',
        id: message.id,
        action: 'stdin',
        containerId: message.containerId,
        input: message.input,
      };

      try {
        await this.sendToNode(nodeId, commandMessage);
        logger.info(`Stdin forwarded to container ${message.containerId}`, {
          userId,
          commandId: message.id,
        });
      } catch (error) {
        logger.error("Error forwarding stdin to node", {
          error: error instanceof Error ? error.message : String(error),
          nodeId,
          containerId: message.containerId,
        });
        this.sendToClient(userId, {
          type: "stdin_result",
          commandId: message.id,
          status: "error",
          error: "Failed to send input to container",
        });
      }
    } catch (error) {
      logger.error("Error handling stdin", {
        error: error instanceof Error ? error.message : String(error),
        userId,
        containerId: message.containerId,
      });
      this.sendToClient(userId, {
        type: "stdin_result",
        commandId: message.id,
        status: "error",
        error: "Internal server error",
      });
    }
  }

  // Check if user has assignment to container
  private async checkContainerAssignment(
    userId: string,
    containerId: string
  ): Promise<boolean> {
    const assignment = await db
      .select()
      .from(table.userContainerAssignments)
      .where(
        and(
          eq(table.userContainerAssignments.userId, userId),
          eq(table.userContainerAssignments.containerId, containerId)
        )
      )
      .limit(1);

    return assignment.length > 0;
  }

  // Handle client disconnect
  public async handleClientDisconnect(userId: string): Promise<void> {
    logger.info(`Client ${userId} disconnected`);

    // Remove client connection
    this.clientConnections.delete(userId);

    // Remove user from all subscriptions
    for (const [containerId, subscribers] of this.subscriptions.entries()) {
      subscribers.delete(userId);
      if (subscribers.size === 0) {
        this.subscriptions.delete(containerId);
      }
    }
  }

  // Handle client connection errors
  private handleClientError(userId: string, error: Event): void {
    logger.error("Client WebSocket error", {
      error: error instanceof Error ? error.message : String(error),
      userId,
    });
    // Connection will be cleaned up by onclose handler
  }

  // Handle agent identification
  private async handleAgentIdentify(
    connectionId: string,
    message: AgentIdentifyMessage
  ): Promise<void> {
    logger.info(`Agent identified: ${message.nodeName} v${message.version}`);
    // Send acknowledgment
    this.sendToConnection(connectionId, {
      type: "agent_identified",
      status: "success",
    });
  }

  // Handle heartbeat messages from agents
  private async handleHeartbeat(
    connectionId: string,
    message: HeartbeatMessage
  ): Promise<void> {
    try {
      const { resources, timestamp } = message;

      // Get the WebSocket connection to extract the correct node ID
      const ws = this.connections.get(connectionId);
      if (!ws) {
        logger.warn("Heartbeat received but connection not found", { connectionId });
        return;
      }

      // Extract node ID from WebSocket data (set during handleNodeConnection)
      const nodeId = (ws.data.store as any)?.nodeId;
      if (!nodeId) {
        logger.warn("Heartbeat received but no nodeId in connection data", { connectionId });
        return;
      }

      // Verify the node exists in the database before inserting
      const existingNode = await db
        .select()
        .from(table.nodes)
        .where(eq(table.nodes.id, nodeId))
        .limit(1);

      if (!existingNode.length) {
        logger.error("Node not found in database", { nodeId, connectionId });
        return;
      }

      // Check if node health record already exists
      const existingHealth = await db
        .select()
        .from(table.node_health)
        .where(eq(table.node_health.node_id, nodeId))
        .limit(1);

      if (existingHealth.length > 0) {
        // Update existing record
        await db
          .update(table.node_health)
          .set({
            status: "healthy",
            last_heartbeat: new Date(timestamp),
            updatedAt: sql`now()`,
          })
          .where(eq(table.node_health.node_id, nodeId));
      } else {
        // Insert new record
        await db.insert(table.node_health).values({
          node_id: nodeId,
          status: "healthy",
          last_heartbeat: new Date(timestamp),
          updatedAt: sql`now()`,
        });
      }

      logger.info(`Heartbeat received from node ${nodeId}`, { resources });
    } catch (error) {
      logger.error("Error handling heartbeat", {
        error: error instanceof Error ? error.message : String(error),
        connectionId,
      });
    }
  }

  // Handle command results from agents
  private async handleCommandResult(
    message: CommandResultMessage
  ): Promise<void> {
    try {
      logger.info(`Command ${message.commandId} ${message.status}`);

      // Resolve pending command promise
      const pendingCommand = this.pendingCommands.get(message.commandId);
      if (pendingCommand) {
        if (message.status === "success") {
          pendingCommand.resolve(message.result || {});
        } else {
          pendingCommand.reject(new Error(message.error || "Command failed"));
        }
        this.pendingCommands.delete(message.commandId);
      }

      if (message.status === "success") {
        // Update container status based on action
        const statusMap: Record<string, string> = {
          create: "running",
          start: "running",
          stop: "stopped",
          restart: "running",
          delete: "stopped",
        };

        const newStatus = statusMap[message.result?.action || ""];
        if (newStatus) {
          await db
            .update(table.containers)
            .set({
              status: newStatus,
              updatedAt: sql`now()`,
            })
            .where(
              eq(table.containers.uuid, message.result?.containerId || "")
            );
        }

        // Append logs if provided
        if (message.logs && message.logs.length > 0) {
          await this.appendContainerLogs(
            message.result?.containerId || "",
            message.logs
          );
        }
      } else {
        // Update container status to error
        await db
          .update(table.containers)
          .set({
            status: "error",
            updatedAt: sql`now()`,
          })
          .where(eq(table.containers.uuid, message.result?.containerId || ""));
      }
    } catch (error) {
      logger.error("Error handling command result", {
        error: error instanceof Error ? error.message : String(error),
        commandId: message.commandId,
      });
    }
  }

  // Handle stdin results from agents
  private async handleStdinResult(
    message: StdinResult
  ): Promise<void> {
    try {
      logger.info(`Stdin ${message.commandId} ${message.status}`);

      // Find the original client connection to send the result back
      // We need to find which user sent the original stdin command
      // For now, we'll broadcast to all clients subscribed to the container
      // In a production system, you might want to track the original sender

      // Get container ID from the command ID (this is a simplified approach)
      // In practice, you might want to store a mapping of commandId to userId
      const containerId = await this.getContainerIdFromCommandId(message.commandId);

      if (containerId) {
        const subscribers = this.subscriptions.get(containerId);
        if (subscribers && subscribers.size > 0) {
          const resultMessage = {
            type: "stdin_result",
            commandId: message.commandId,
            status: message.status,
            output: message.output,
            error: message.error,
          };

          // Send to all subscribers of this container
          for (const userId of subscribers) {
            this.sendToClient(userId, resultMessage);
          }
        }
      }
    } catch (error) {
      logger.error("Error handling stdin result", {
        error: error instanceof Error ? error.message : String(error),
        commandId: message.commandId,
      });
    }
  }

  // Helper method to get container ID from command ID
  private async getContainerIdFromCommandId(commandId: string): Promise<string | null> {
    try {
      // This is a simplified approach - in practice you might want to store
      // a mapping of commandId to containerId when sending the command
      // For now, we'll return null and handle this in the agent
      return null;
    } catch (error) {
      logger.error("Error getting container ID from command ID", {
        error: error instanceof Error ? error.message : String(error),
        commandId,
      });
      return null;
    }
  }

  // Append logs to container
  private async appendContainerLogs(
    containerId: string,
    logs: string[]
  ): Promise<void> {
    try {
      // Insert logs into database
      const logEntries = logs.map((log) => ({
        id: crypto.randomUUID(),
        containerUuid: containerId,
        message: log,
        level: "info",
        timestamp: sql`now()`,
        createdAt: sql`now()`,
      }));

      await db.insert(table.logs).values(logEntries);

      // Broadcast logs to subscribers
      await this.broadcastLogsToSubscribers(containerId, logs);
    } catch (error) {
      logger.error("Error appending container logs", {
        error: error instanceof Error ? error.message : String(error),
        containerId,
      });
    }
  }

  // Broadcast logs to subscribed clients
  private async broadcastLogsToSubscribers(
    containerId: string,
    logs: string[]
  ): Promise<void> {
    const subscribers = this.subscriptions.get(containerId);

    if (!subscribers || subscribers.size === 0) {
      return;
    }

    const logMessages: LogMessage[] = logs.map((log) => ({
      type: "log",
      containerId,
      message: log,
      level: "info",
      timestamp: new Date().toISOString(),
    }));

    // Send to all subscribers
    for (const userId of subscribers) {
      for (const logMessage of logMessages) {
        this.sendToClient(userId, logMessage);
      }
    }
  }

  // Handle connection disconnect
  public async handleDisconnect(
    connectionId: string,
    nodeId: string
  ): Promise<void> {
    logger.info(`Node ${nodeId} disconnected`);

    // Remove from connection maps
    this.connections.delete(connectionId);
    this.nodeConnections.delete(nodeId);

    // Update node status to offline
    await db
      .update(table.nodes)
      .set({
        status: "offline",
        updatedAt: sql`now()`,
      })
      .where(eq(table.nodes.id, nodeId));
  }

  // Handle connection errors
  private handleError(connectionId: string, error: Event): void {
    logger.error("WebSocket error", {
      error: error instanceof Error ? error.message : String(error),
      connectionId,
    });
    // Connection will be cleaned up by onclose handler
  }

  // Send message to specific node
  async sendToNode(
    nodeId: string,
    message: CommandMessage
  ): Promise<CommandResult> {
    const connectionId = this.nodeConnections.get(nodeId);
    if (!connectionId) {
      logger.warn(`No connection found for node ${nodeId}`);
      throw new Error(`No connection found for node ${nodeId}`);
    }

    const ws = this.connections.get(connectionId);
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      logger.warn(`Connection not available for node ${nodeId}`);
      throw new Error(`Connection not available for node ${nodeId}`);
    }

    // Add command ID if not provided
    if (!message.id) {
      message.id = crypto.randomUUID();
    }

    // Create promise for command response
    const commandPromise = new Promise<CommandResult>((resolve, reject) => {
      this.pendingCommands.set(message.id!, { resolve, reject });
    });

    this.sendToConnection(connectionId, message);

    // Set timeout for command response (30 seconds)
    const timeoutPromise = new Promise<CommandResult>((_, reject) => {
      setTimeout(() => {
        this.pendingCommands.delete(message.id!);
        reject(
          new Error(`Command timeout for ${message.action} on node ${nodeId}`)
        );
      }, 30000);
    });

    return Promise.race([commandPromise, timeoutPromise]);
  }

  // Send message to specific connection
  private sendToConnection(
    connectionId: string,
    message: WebSocketMessage
  ): void {
    const ws = this.connections.get(connectionId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  // Send message to specific client
  private sendToClient(userId: string, message: WebSocketMessage): void {
    const ws = this.clientConnections.get(userId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  // Broadcast message to all connected nodes
  broadcast(message: WebSocketMessage): void {
    for (const connectionId of this.connections.keys()) {
      this.sendToConnection(connectionId, message);
    }
  }

  // Close all connections
  closeAll(): void {
    for (const [connectionId, ws] of this.connections) {
      try {
        ws.close(1000, "Server shutting down");
      } catch (error) {
        logger.error(`Error closing connection ${connectionId}`, {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
    this.connections.clear();
    this.nodeConnections.clear();
    this.clientConnections.clear();
    this.subscriptions.clear();
  }

  // Get connected node IDs
  getConnectedNodes(): string[] {
    return Array.from(this.nodeConnections.keys());
  }

  // Check if node is connected
  isNodeConnected(nodeId: string): boolean {
    return this.nodeConnections.has(nodeId);
  }
}

// Export singleton instance
export const wsManager = new WebSocketManager();