import Elysia, { t, Static } from "elysia";
import { wsManager } from "../libs/websocket";
import { baseResponseType } from "../types";
import { db } from "../database";
import { table } from "../database/schema";
import { eq, desc, sql, and } from "drizzle-orm";
import { checkContainerAssignment } from "../utils";
import { auth } from "../libs/auth/auth";

// Log query parameters type
const logsQueryType = t.Object({
  limit: t.Optional(t.Number({ minimum: 1, maximum: 1000 })),
  since: t.Optional(t.String()),
  level: t.Optional(t.String()),
  containerId: t.Optional(t.String()),
});

// Log entry type
const logEntryType = t.Object({
  id: t.String(),
  containerUuid: t.String(),
  nodeId: t.Optional(t.String()),
  timestamp: t.String(),
  message: t.String(),
  level: t.String(),
  createdAt: t.String(),
});

export const logsRouter = new Elysia()
  .resolve(async (context) => {
    const session = await auth.api.getSession({ headers: context.request.headers });

    if (!session || !session.user) {
      context.set.status = 401;
      return {
        status: 401,
        type: "error",
        success: false,
        message: "Unauthorized: Authentication required"
      };
    }

    return {
      user: session.user,
      session: session.session
    };
  })
  // WebSocket endpoint for real-time log streaming
  .ws("/ws", {
    open() {
      console.log("WebSocket connection opened for logs");
    },
    message(ws, message) {
      // Handle client messages (subscribe/unsubscribe)
      handleLogWebSocketMessage(ws, message);
    },
    close() {
      console.log("WebSocket connection closed for logs");
    },
  })
  // REST endpoint for fetching historical logs
  .get(
    "/",
    async (ctx) => {
      const { limit = 100, since, level, containerId } = ctx.query;

      try {
       const user = ctx.user; // User is guaranteed to exist due to resolve function

        // Build where conditions
        const whereConditions = [];

        if (containerId) {
          // Check if user has access to this container
           const container = await db
             .select({
               id: table.containers.id,
               userId: table.containers.userId,
               uuid: table.containers.uuid,
               nodeId: table.containers.nodeId
             })
             .from(table.containers)
             .where(eq(table.containers.uuid, containerId))
             .limit(1);

           if (!container.length) {
             return ctx.error(404, {
               status: 404,
               type: "error",
               success: false,
               message: "Container not found",
             });
           }

           // Check ownership or assignment
           const userId = (user as any).id;
           const hasAccess =
             container[0].userId === userId ||
             (await checkContainerAssignment(userId, container[0].id));

          if (!hasAccess) {
            return ctx.error(403, {
              status: 403,
              type: "error",
              success: false,
              message: "Access denied to container logs",
            });
          }

          whereConditions.push(eq(table.logs.containerUuid, containerId));
        } else {
          // If no specific container, get logs for user's containers
          const userId = (user as any).id;
          const userContainers = await db
            .select({ uuid: table.containers.uuid })
            .from(table.containers)
            .where(eq(table.containers.userId, userId));

          if (userContainers.length === 0) {
            return {
              status: 200,
              message: "No logs found",
              success: true,
              type: "success",
              data: {
                logs: [],
                pagination: {
                  page: 1,
                  limit: Number(limit),
                  total: 0,
                  pages: 0,
                },
              },
            };
          }

          const containerUuids = userContainers.map((c) => c.uuid);
          whereConditions.push(
            sql`${table.logs.containerUuid} IN ${containerUuids}`
          );
        }

        if (since) {
          whereConditions.push(sql`${table.logs.timestamp} >= ${since}`);
        }

        if (level) {
          whereConditions.push(eq(table.logs.level, level));
        }

        const whereClause =
          whereConditions.length > 0 ? and(...whereConditions) : undefined;

        // Get logs
        const logs = await db
          .select({
            id: table.logs.id,
            containerUuid: table.logs.containerUuid,
            nodeId: table.logs.nodeId,
            timestamp: sql<string>`${table.logs.timestamp}::text`,
            message: table.logs.message,
            level: table.logs.level,
            createdAt: sql<string>`${table.logs.createdAt}::text`,
          })
          .from(table.logs)
          .where(whereClause)
          .orderBy(desc(table.logs.timestamp))
          .limit(Number(limit));

        // Get total count
        const total = await db
          .select({ count: sql<number>`count(*)` })
          .from(table.logs)
          .where(whereClause);

        return {
          status: 200,
          message: "Logs fetched successfully",
          success: true,
          type: "success",
          data: {
            logs: logs as Static<typeof logEntryType>[],
            pagination: {
              page: 1,
              limit: Number(limit),
              total: total[0].count,
              pages: Math.ceil(total[0].count / Number(limit)),
            },
          },
        };
      } catch (error: any) {
        return ctx.error(400, {
          status: 400,
          type: "error",
          success: false,
          message: error.message || "Failed to fetch logs",
        });
      }
    },
    {
      query: logsQueryType,
      response: {
        200: baseResponseType(
          t.Object({
            logs: t.Array(logEntryType),
            pagination: t.Object({
              page: t.Number(),
              limit: t.Number(),
              total: t.Number(),
              pages: t.Number(),
            }),
          })
        ),
        404: baseResponseType(t.Null()),
        403: baseResponseType(t.Null()),
        400: baseResponseType(t.Null()),
      },
      detail: {
        description: "Fetch container logs with optional filters",
        tags: ["logs", "api"],
      },
    }
  );

// Helper function to handle WebSocket messages for log streaming
async function handleLogWebSocketMessage(ws: any, message: any) {
  try {
    const messageData =
      typeof message === "string" ? JSON.parse(message) : message;

    switch (messageData.type) {
      case "subscribe":
        await handleLogSubscribe(ws, messageData);
        break;
      case "unsubscribe":
        await handleLogUnsubscribe(ws, messageData);
        break;
      default:
        console.log("Unknown message type:", messageData.type);
        ws.send(
          JSON.stringify({
            type: "error",
            message: "Unknown message type",
          })
        );
    }
  } catch (error) {
    console.error("Error handling WebSocket message:", error);
    ws.send(
      JSON.stringify({
        type: "error",
        message: "Invalid message format",
      })
    );
  }
}

// Helper function to handle log subscription
async function handleLogSubscribe(ws: any, message: any) {
  try {
    const { containerId } = message;

    if (!containerId) {
      ws.send(
        JSON.stringify({
          type: "error",
          message: "containerId is required for subscribe",
        })
      );
      return;
    }

    // Check if user has access to this container
     const container = await db
       .select({
         id: table.containers.id,
         userId: table.containers.userId,
         uuid: table.containers.uuid,
         nodeId: table.containers.nodeId
       })
       .from(table.containers)
       .where(eq(table.containers.uuid, containerId))
       .limit(1);

     if (!container.length) {
       ws.send(
         JSON.stringify({
           type: "error",
           message: "Container not found",
         })
       );
       return;
     }

     // Check ownership or assignment
     const user = ws.data?.user;
     if (!user) {
       ws.send(
         JSON.stringify({
           type: "error",
           message: "User not authenticated",
         })
       );
       return;
     }

     const hasAccess =
       container[0].userId === user.id ||
       (await checkContainerAssignment(user.id, container[0].id));

    if (!hasAccess) {
      ws.send(
        JSON.stringify({
          type: "error",
          message: "Access denied to container logs",
        })
      );
      return;
    }

    // Send logs command to node agent
    try {
      await wsManager.sendToNode(container[0].nodeId, {
        type: "command",
        action: "logs",
        containerId: containerId,
        lines: 100, // Default to last 100 lines
      });

      ws.send(
        JSON.stringify({
          type: "subscribed",
          containerId: containerId,
        })
      );
    } catch (error) {
      console.error("Error sending logs command to node:", error);
      ws.send(
        JSON.stringify({
          type: "error",
          message: "Failed to start log streaming",
        })
      );
    }
  } catch (error) {
    console.error("Error handling log subscription:", error);
    ws.send(
      JSON.stringify({
        type: "error",
        message: "Internal server error",
      })
    );
  }
}

// Helper function to handle log unsubscription
async function handleLogUnsubscribe(ws: any, message: any) {
  try {
    const { containerId } = message;

    if (!containerId) {
      ws.send(
        JSON.stringify({
          type: "error",
          message: "containerId is required for unsubscribe",
        })
      );
      return;
    }

    ws.send(
      JSON.stringify({
        type: "unsubscribed",
        containerId: containerId,
      })
    );
  } catch (error) {
    console.error("Error handling log unsubscription:", error);
    ws.send(
      JSON.stringify({
        type: "error",
        message: "Internal server error",
      })
    );
  }
}
