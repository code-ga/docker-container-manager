import Elysia, { t, Static } from "elysia";
import { wsManager } from "../libs/websocket";
import { userMiddleware } from "../middlewares/auth-middleware";
import { baseResponseType } from "../types";
import { db } from "../database";
import { table } from "../database/schema";
import { eq, desc, sql, and } from "drizzle-orm";

// Log query parameters type
const logsQueryType = t.Object({
  limit: t.Optional(t.Number({ minimum: 1, maximum: 1000 })),
  since: t.Optional(t.String()),
  level: t.Optional(t.String()),
  containerId: t.Optional(t.String())
});

// Log entry type
const logEntryType = t.Object({
  id: t.String(),
  containerUuid: t.String(),
  nodeId: t.Optional(t.String()),
  timestamp: t.String(),
  message: t.String(),
  level: t.String(),
  createdAt: t.String()
});

export const logsRouter = new Elysia({ prefix: "/logs" })
  .resolve(userMiddleware)
  // WebSocket endpoint for real-time log streaming
  .ws("/ws", {
    open(ws) {
      console.log("WebSocket connection opened for logs");
    },
    message(ws, message) {
      // Handle client messages (subscribe/unsubscribe)
      // Note: WebSocket connection handling is done at the server level
      console.log("Received message:", message);
    },
    close(ws) {
      console.log("WebSocket connection closed for logs");
    }
  })

  // REST endpoint for fetching historical logs
  .get("/", async (ctx) => {
    const {
      limit = 100,
      since,
      level,
      containerId
    } = ctx.query;

    try {
      const user = ctx.user;

      // Build where conditions
      const whereConditions = [];

      if (containerId) {
        // Check if user has access to this container
        const container = await db
          .select()
          .from(table.containers)
          .where(eq(table.containers.uuid, containerId))
          .limit(1);

        if (!container.length) {
          return ctx.error(404, {
            status: 404,
            type: "error",
            success: false,
            message: "Container not found"
          });
        }

        // Check ownership or assignment
        const hasAccess = container[0].userId === user.id ||
          await checkContainerAssignment(user.id, container[0].id);

        if (!hasAccess) {
          return ctx.error(403, {
            status: 403,
            type: "error",
            success: false,
            message: "Access denied to container logs"
          });
        }

        whereConditions.push(eq(table.logs.containerUuid, containerId));
      } else {
        // If no specific container, get logs for user's containers
        const userContainers = await db
          .select({ uuid: table.containers.uuid })
          .from(table.containers)
          .where(eq(table.containers.userId, user.id));

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
                pages: 0
              }
            }
          };
        }

        const containerUuids = userContainers.map(c => c.uuid);
        whereConditions.push(sql`${table.logs.containerUuid} IN ${containerUuids}`);
      }

      if (since) {
        whereConditions.push(sql`${table.logs.timestamp} >= ${since}`);
      }

      if (level) {
        whereConditions.push(eq(table.logs.level, level));
      }

      const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

      // Get logs
      const logs = await db
        .select({
          id: table.logs.id,
          containerUuid: table.logs.containerUuid,
          nodeId: table.logs.nodeId,
          timestamp: sql<string>`${table.logs.timestamp}::text`,
          message: table.logs.message,
          level: table.logs.level,
          createdAt: sql<string>`${table.logs.createdAt}::text`
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
            pages: Math.ceil(total[0].count / Number(limit))
          }
        }
      };

    } catch (error: any) {
      return ctx.error(400, {
        status: 400,
        type: "error",
        success: false,
        message: error.message || "Failed to fetch logs"
      });
    }
  }, {
    query: logsQueryType,
    response: {
      200: baseResponseType(t.Object({
        logs: t.Array(logEntryType),
        pagination: t.Object({
          page: t.Number(),
          limit: t.Number(),
          total: t.Number(),
          pages: t.Number()
        })
      })),
      404: baseResponseType(t.Null()),
      403: baseResponseType(t.Null()),
      400: baseResponseType(t.Null())
    },
    detail: {
      description: "Fetch container logs with optional filters",
      tags: ["logs", "api"]
    }
  });

// Helper function to check container assignment (same as in containers.ts)
async function checkContainerAssignment(userId: string, containerId: string): Promise<boolean> {
  const { db } = await import("../database");
  const { table } = await import("../database/schema");
  const { eq, and } = await import("drizzle-orm");

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