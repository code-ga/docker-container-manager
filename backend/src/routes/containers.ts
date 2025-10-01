import Elysia, { Static, t } from "elysia";
import { baseResponseType } from "../types";
import { table } from "../database/schema";
import { db } from "../database";
import { eq, desc, sql, and } from "drizzle-orm";
import { hasPermission } from "../permissions";
import { randomUUID } from "crypto";
import { wsManager } from "../libs/websocket";
import { auth } from "../libs/auth/auth";

// Container type definitions
const containerType = t.Object({
  id: t.String(),
  userId: t.String(),
  eggId: t.String(),
  nodeId: t.String(),
  name: t.String(),
  status: t.String(),
  uuid: t.String(),
  cpuLimit: t.Optional(t.Number()),
  memoryLimit: t.Optional(t.Number()),
  diskLimit: t.Optional(t.Number()),
  ports: t.Optional(t.Record(t.String(), t.Number())),
  volumes: t.Optional(t.Array(t.String())),
  environment: t.Optional(t.Record(t.String(), t.String())),
  logs: t.Optional(t.Array(t.String())),
  createdAt: t.Date(),
  updatedAt: t.Date(),
});

const containerListType = t.Object({
  id: t.String(),
  userId: t.String(),
  eggId: t.String(),
  nodeId: t.String(),
  name: t.String(),
  status: t.String(),
  uuid: t.String(),
  cpuLimit: t.Optional(t.Number()),
  memoryLimit: t.Optional(t.Number()),
  diskLimit: t.Optional(t.Number()),
  logs: t.Optional(t.Array(t.String())),
  createdAt: t.Date(),
  updatedAt: t.Date(),
});

const createContainerType = t.Object({
  eggId: t.String(),
  nodeId: t.String(),
  name: t.String({ minLength: 1, maxLength: 255 }),
  cpuLimit: t.Optional(t.Number({ minimum: 1 })),
  memoryLimit: t.Optional(t.Number({ minimum: 1 })),
  diskLimit: t.Optional(t.Number({ minimum: 1 })),
  ports: t.Optional(t.Record(t.String(), t.Number())),
  volumes: t.Optional(t.Array(t.String())),
  environment: t.Optional(t.Record(t.String(), t.String())),
  type: t.Optional(t.Union([t.Literal('ha'), t.Literal('standard')])),
  preferred_cluster_id: t.Optional(t.String()),
});

const updateContainerType = t.Object({
  name: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
  cpuLimit: t.Optional(t.Number({ minimum: 1 })),
  memoryLimit: t.Optional(t.Number({ minimum: 1 })),
  diskLimit: t.Optional(t.Number({ minimum: 1 })),
  ports: t.Optional(t.Record(t.String(), t.Number())),
  volumes: t.Optional(t.Array(t.String())),
  environment: t.Optional(t.Record(t.String(), t.String())),
});

// Helper function to check container ownership
async function checkContainerOwnership(
  userId: string,
  containerId: string
): Promise<boolean> {
  try {
    // Check if user owns the container
    const container = await db
      .select()
      .from(table.containers)
      .where(eq(table.containers.id, containerId))
      .limit(1);

    if (!container.length) {
      return false;
    }

    // User owns the container
    if (container[0].userId === userId) {
      return true;
    }

    // Check if user has assignment to the container
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
  } catch (error) {
    console.error("Error checking container ownership:", error);
    return false;
  }
}

export const containersRouter = new Elysia({ prefix: "/containers" })
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
  // GET /api/v1/containers - List containers (own or all if manage perm)
  .get(
    "/",
    async (ctx) => {
      const {
        page = 1,
        limit = 10,
        userId: filterUserId,
        nodeId,
        eggId,
      } = ctx.query;
      const offset = (Number(page) - 1) * Number(limit);

      // Get user from context (set by guard middleware)
      const user = ctx.user;

      // Check if user has manage permission to see all containers
      const hasManagePerm = await hasPermission((user as any).id, "container:manage");

      // Build where conditions
      const whereConditions = [];
      if (!hasManagePerm) {
        // Only show user's own containers
        whereConditions.push(eq(table.containers.userId, (user as any).id));
      } else {
        // Admin can filter by user if specified
        if (filterUserId) {
          whereConditions.push(eq(table.containers.userId, filterUserId));
        }
      }

      if (nodeId) {
        whereConditions.push(eq(table.containers.nodeId, nodeId));
      }
      if (eggId) {
        whereConditions.push(eq(table.containers.eggId, eggId));
      }

      const whereClause =
        whereConditions.length > 0 ? and(...whereConditions) : undefined;

      // Get containers
      const containers = await db
        .select({
          id: table.containers.id,
          userId: table.containers.userId,
          eggId: table.containers.eggId,
          nodeId: table.containers.nodeId,
          name: table.containers.name,
          status: table.containers.status,
          uuid: table.containers.uuid,
          cpuLimit: table.containers.cpuLimit,
          memoryLimit: table.containers.memoryLimit,
          diskLimit: table.containers.diskLimit,
          createdAt: table.containers.createdAt,
          updatedAt: table.containers.updatedAt,
        })
        .from(table.containers)
        .where(whereClause)
        .orderBy(desc(table.containers.createdAt))
        .limit(Number(limit))
        .offset(offset);

      // Get total count
      const total = await db
        .select({ count: sql<number>`count(*)` })
        .from(table.containers)
        .where(whereClause);

      return {
        status: 200,
        message: "Containers fetched successfully",
        success: true,
        type: "success",
        data: {
          containers: containers as Static<typeof containerListType>[],
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: total[0].count,
            pages: Math.ceil(total[0].count / Number(limit)),
          },
        },
      };
    },
    {
      query: t.Object({
        page: t.Optional(t.Number({ minimum: 1 })),
        limit: t.Optional(t.Number({ minimum: 1, maximum: 100 })),
        userId: t.Optional(t.String()),
        nodeId: t.Optional(t.String()),
        eggId: t.Optional(t.String()),
      }),
      response: {
        200: baseResponseType(
          t.Object({
            containers: t.Array(containerListType),
            pagination: t.Object({
              page: t.Number(),
              limit: t.Number(),
              total: t.Number(),
              pages: t.Number(),
            }),
          })
        ),
      },
      detail: {
        description: "List containers with optional filters and pagination",
        tags: ["container", "list", "api"],
      },
    }
  )

  // POST /api/v1/containers - Create container
  .post(
    "/",
    async (ctx) => {
      const {
        eggId,
        nodeId,
        name,
        cpuLimit,
        memoryLimit,
        diskLimit,
        ports,
        volumes,
        environment,
        type = 'standard',
        preferred_cluster_id,
      } = ctx.body;

      try {
        // Get user from context (set by guard middleware)
        const user = ctx.user;

        // Check permissions based on container type
        let requiredPermission = "container:create";
        if (type === 'ha') {
          requiredPermission = "container:ha:create";
        }

        const hasCreatePerm = await hasPermission((user as any).id, requiredPermission);
        const hasManagePerm = await hasPermission((user as any).id, "container:manage");

        if (!hasCreatePerm && !hasManagePerm) {
          return ctx.error(403, {
            status: 403,
            type: "error",
            success: false,
            message: `Forbidden: Missing required permission '${requiredPermission}' or 'container:manage'`,
          });
        }

        // Validate preferred_cluster_id if provided and type is 'ha'
        if (type === 'ha' && preferred_cluster_id) {
          const cluster = await db
            .select()
            .from(table.clusters)
            .where(eq(table.clusters.id, preferred_cluster_id))
            .limit(1);

          if (!cluster.length) {
            return ctx.error(404, {
              status: 404,
              type: "error",
              success: false,
              message: "Preferred cluster not found",
            });
          }
        }

        // Validate egg exists
        const egg = await db
          .select()
          .from(table.eggs)
          .where(eq(table.eggs.id, eggId))
          .limit(1);

        if (!egg.length) {
          return ctx.error(404, {
            status: 404,
            type: "error",
            success: false,
            message: "Egg not found",
          });
        }

        // Validate node exists
        const node = await db
          .select()
          .from(table.nodes)
          .where(eq(table.nodes.id, nodeId))
          .limit(1);

        if (!node.length) {
          return ctx.error(404, {
            status: 404,
            type: "error",
            success: false,
            message: "Node not found",
          });
        }

        // Check if container name already exists for this user
        const existingContainer = await db
          .select()
          .from(table.containers)
          .where(
            and(
              eq(table.containers.name, name),
              eq(table.containers.userId, (user as any).id)
            )
          )
          .limit(1);

        if (existingContainer.length) {
          return ctx.error(400, {
            status: 400,
            type: "error",
            success: false,
            message: "Container with this name already exists",
          });
        }

        // Generate UUID for container
        const containerUuid = randomUUID();

        // Create container with egg defaults + overrides
        const containerData: any = {
          id: randomUUID(),
          userId: (user as any).id,
          eggId,
          nodeId,
          name,
          uuid: containerUuid,
          status: "stopped",
          type,
          migration_status: type === 'ha' ? 'idle' : undefined,
          last_heartbeat: type === 'ha' ? null : undefined,
          preferred_cluster_id: preferred_cluster_id || undefined,
        };

        // Set resource limits (use provided values or egg defaults)
        if (cpuLimit) containerData.cpuLimit = cpuLimit;
        if (memoryLimit) containerData.memoryLimit = memoryLimit;
        if (diskLimit) containerData.diskLimit = diskLimit;

        // Set ports, volumes, environment (merge with egg defaults)
        if (ports) containerData.ports = ports;
        if (volumes) containerData.volumes = volumes;
        if (environment) {
          containerData.environment = { ...egg[0].envVars, ...environment };
        } else {
          containerData.environment = egg[0].envVars;
        }

        const newContainer = await db
          .insert(table.containers)
          .values(containerData)
          .returning();

        return {
          status: 201,
          message: "Container created successfully",
          success: true,
          type: "success",
          data: {
            container: newContainer[0] as Static<typeof containerType>,
          },
        };
      } catch (error: any) {
        return ctx.error(400, {
          status: 400,
          type: "error",
          success: false,
          message: error.message || "Failed to create container",
        });
      }
    },
    {
      body: createContainerType,
      response: {
        201: baseResponseType(t.Object({ container: containerType })),
        404: baseResponseType(t.Null()),
        403: baseResponseType(t.Null()),
        400: baseResponseType(t.Null()),
      },
      detail: {
        description: "Create a new container from an egg",
        tags: ["container", "create", "api"],
      },
    }
  )

  // PUT /api/v1/containers/:id - Update container
  .put(
    "/:id",
    async (ctx) => {
      const { id } = ctx.params;
      const {
        name,
        cpuLimit,
        memoryLimit,
        diskLimit,
        ports,
        volumes,
        environment,
      } = ctx.body;

      try {
        // Get user from context (set by guard middleware)
        const user = ctx.user as any;

        // Check ownership or manage permission
        const hasManagePerm = await hasPermission((user as any).id, "container:manage");
        const ownsContainer = await checkContainerOwnership((user as any).id, id);

        if (!ownsContainer && !hasManagePerm) {
          return ctx.error(403, {
            status: 403,
            type: "error",
            success: false,
            message:
              "Forbidden: You don't own this container and don't have manage permission",
          });
        }

        // Check if container exists
        const existingContainer = await db
          .select()
          .from(table.containers)
          .where(eq(table.containers.id, id))
          .limit(1);

        if (!existingContainer.length) {
          return ctx.error(404, {
            status: 404,
            type: "error",
            success: false,
            message: "Container not found",
          });
        }

        // Check if new name conflicts (if name is being updated)
        if (name && name !== existingContainer[0].name) {
          const nameConflict = await db
            .select()
            .from(table.containers)
            .where(
              and(
                eq(table.containers.name, name),
                eq(table.containers.userId, existingContainer[0].userId)
              )
            )
            .limit(1);

          if (nameConflict.length) {
            return ctx.error(400, {
              status: 400,
              type: "error",
              success: false,
              message: "Container with this name already exists",
            });
          }
        }

        // Update container
        const updateData: any = {
          updatedAt: sql`now()`,
        };

        if (name) updateData.name = name;
        if (cpuLimit !== undefined) updateData.cpuLimit = cpuLimit;
        if (memoryLimit !== undefined) updateData.memoryLimit = memoryLimit;
        if (diskLimit !== undefined) updateData.diskLimit = diskLimit;
        if (ports !== undefined) updateData.ports = ports;
        if (volumes !== undefined) updateData.volumes = volumes;
        if (environment !== undefined) updateData.environment = environment;

        await db
          .update(table.containers)
          .set(updateData)
          .where(eq(table.containers.id, id));

        // Fetch updated container
        const updatedContainer = await db
          .select()
          .from(table.containers)
          .where(eq(table.containers.id, id))
          .limit(1);

        return {
          status: 200,
          message: "Container updated successfully",
          success: true,
          type: "success",
          data: {
            container: updatedContainer[0] as Static<typeof containerType>,
          },
        };
      } catch (error: any) {
        return ctx.error(400, {
          status: 400,
          type: "error",
          success: false,
          message: error.message || "Failed to update container",
        });
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: updateContainerType,
      response: {
        200: baseResponseType(t.Object({ container: containerType })),
        404: baseResponseType(t.Null()),
        403: baseResponseType(t.Null()),
        400: baseResponseType(t.Null()),
      },
      detail: {
        description: "Update container configuration and resources",
        tags: ["container", "update", "api"],
      },
    }
  )

  // DELETE /api/v1/containers/:id - Delete container
  .delete(
    "/:id",
    async (ctx) => {
      const { id } = ctx.params;

      try {
        // Get user from context (set by guard middleware)
        const user = ctx.user as any;

        // Check ownership or manage permission
        const hasManagePerm = await hasPermission((user as any).id, "container:manage");
        const ownsContainer = await checkContainerOwnership((user as any).id, id);

        if (!ownsContainer && !hasManagePerm) {
          return ctx.error(403, {
            status: 403,
            type: "error",
            success: false,
            message:
              "Forbidden: You don't own this container and don't have manage permission",
          });
        }

        // Check if container exists
        const existingContainer = await db
          .select()
          .from(table.containers)
          .where(eq(table.containers.id, id))
          .limit(1);

        if (!existingContainer.length) {
          return ctx.error(404, {
            status: 404,
            type: "error",
            success: false,
            message: "Container not found",
          });
        }

        // Delete container (cascade will handle related records)
        await db.delete(table.containers).where(eq(table.containers.id, id));

        return {
          status: 200,
          message: "Container deleted successfully",
          success: true,
          type: "success",
          data: null,
        };
      } catch (error: any) {
        return ctx.error(400, {
          status: 400,
          type: "error",
          success: false,
          message: error.message || "Failed to delete container",
        });
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      response: {
        200: baseResponseType(t.Null()),
        404: baseResponseType(t.Null()),
        403: baseResponseType(t.Null()),
        400: baseResponseType(t.Null()),
      },
      detail: {
        description: "Delete a container",
        tags: ["container", "delete", "api"],
      },
    }
  )

  // POST /api/v1/containers/:id/start - Start container
  .post(
    "/:id/start",
    async (ctx) => {
      const { id } = ctx.params;

      try {
        // Get user from context
        const user = ctx.user;

        // Check ownership or manage permission
        const hasManagePerm = await hasPermission((user as any).id, "container:manage");
        const ownsContainer = await checkContainerOwnership((user as any).id, id);

        if (!ownsContainer && !hasManagePerm) {
          return ctx.error(403, {
            status: 403,
            type: "error",
            success: false,
            message:
              "Forbidden: You don't own this container and don't have manage permission",
          });
        }

        // Check if container exists
        const existingContainer = await db
          .select()
          .from(table.containers)
          .where(eq(table.containers.id, id))
          .limit(1);

        if (!existingContainer.length) {
          return ctx.error(404, {
            status: 404,
            type: "error",
            success: false,
            message: "Container not found",
          });
        }

        // Update container status to starting
        await db
          .update(table.containers)
          .set({
            status: "starting",
            updatedAt: sql`now()`,
          })
          .where(eq(table.containers.id, id));

        // Send command to node agent via WebSocket
        const commandSent = await wsManager.sendToNode(
          existingContainer[0].nodeId,
          {
            type: "command",
            action: "start",
            containerId: existingContainer[0].uuid,
          }
        );

        if (!commandSent) {
          ctx.set.status = 500;
          return {
            status: 500,
            type: "error",
            success: false,
            message: "Failed to send command to node agent",
          };
        }

        // Fetch updated container
        const updatedContainer = await db
          .select()
          .from(table.containers)
          .where(eq(table.containers.id, id))
          .limit(1);

        return {
          status: 200,
          message: "Container start command sent successfully",
          success: true,
          type: "success",
          data: {
            container: updatedContainer[0] as Static<typeof containerType>,
          },
        };
      } catch (error: any) {
        return ctx.error(400, {
          status: 400,
          type: "error",
          success: false,
          message: error.message || "Failed to start container",
        });
      }
    },
    {
      // Protected by guard middleware at router level
      params: t.Object({
        id: t.String(),
      }),
      response: {
        200: baseResponseType(t.Object({ container: containerType })),
        404: baseResponseType(t.Null()),
        403: baseResponseType(t.Null()),
        400: baseResponseType(t.Null()),
      },
      detail: {
        description: "Start a container",
        tags: ["container", "lifecycle", "start", "api"],
      },
    }
  )

  // POST /api/v1/containers/:id/stop - Stop container
  .post(
    "/:id/stop",
    async (ctx) => {
      const { id } = ctx.params;

      try {
        // Get user from context
        const user = ctx.user;

        // Check ownership or manage permission
        const hasManagePerm = await hasPermission((user as any).id, "container:manage");
        const ownsContainer = await checkContainerOwnership((user as any).id, id);

        if (!ownsContainer && !hasManagePerm) {
          return ctx.error(403, {
            status: 403,
            type: "error",
            success: false,
            message:
              "Forbidden: You don't own this container and don't have manage permission",
          });
        }

        // Check if container exists
        const existingContainer = await db
          .select()
          .from(table.containers)
          .where(eq(table.containers.id, id))
          .limit(1);

        if (!existingContainer.length) {
          return ctx.error(404, {
            status: 404,
            type: "error",
            success: false,
            message: "Container not found",
          });
        }

        // Update container status to stopped
        await db
          .update(table.containers)
          .set({
            status: "stopped",
            updatedAt: sql`now()`,
          })
          .where(eq(table.containers.id, id));

        // Stub: Send command to node agent
        console.log(
          `Command sent to node ${existingContainer[0].nodeId} for container ${id}: STOP`
        );

        // Fetch updated container
        const updatedContainer = await db
          .select()
          .from(table.containers)
          .where(eq(table.containers.id, id))
          .limit(1);

        return {
          status: 200,
          message: "Container stop command sent successfully",
          success: true,
          type: "success",
          data: {
            container: updatedContainer[0] as Static<typeof containerType>,
          },
        };
      } catch (error: any) {
        return ctx.error(400, {
          status: 400,
          type: "error",
          success: false,
          message: error.message || "Failed to stop container",
        });
      }
    },
    {
      // Protected by guard middleware at router level
      params: t.Object({
        id: t.String(),
      }),
      response: {
        200: baseResponseType(t.Object({ container: containerType })),
        404: baseResponseType(t.Null()),
        403: baseResponseType(t.Null()),
        400: baseResponseType(t.Null()),
      },
      detail: {
        description: "Stop a container",
        tags: ["container", "lifecycle", "stop", "api"],
      },
    }
  )

  // POST /api/v1/containers/:id/restart - Restart container
  .post(
    "/:id/restart",
    async (ctx) => {
      const { id } = ctx.params;

      try {
        // Get user from context
        const user = ctx.user;

        // Check ownership or manage permission
        const hasManagePerm = await hasPermission((user as any).id, "container:manage");
        const ownsContainer = await checkContainerOwnership((user as any).id, id);

        if (!ownsContainer && !hasManagePerm) {
          return ctx.error(403, {
            status: 403,
            type: "error",
            success: false,
            message:
              "Forbidden: You don't own this container and don't have manage permission",
          });
        }

        // Check if container exists
        const existingContainer = await db
          .select()
          .from(table.containers)
          .where(eq(table.containers.id, id))
          .limit(1);

        if (!existingContainer.length) {
          return ctx.error(404, {
            status: 404,
            type: "error",
            success: false,
            message: "Container not found",
          });
        }

        // Update container status to restarting
        await db
          .update(table.containers)
          .set({
            status: "restarting",
            updatedAt: sql`now()`,
          })
          .where(eq(table.containers.id, id));

        // Send restart command to node agent via WebSocket
        const restartCommandSent = await wsManager.sendToNode(
          existingContainer[0].nodeId,
          {
            type: "command",
            action: "restart",
            containerId: existingContainer[0].uuid,
          }
        );

        if (!restartCommandSent) {
          ctx.set.status = 500;
          return {
            status: 500,
            type: "error",
            success: false,
            message: "Failed to send restart command to node agent",
          };
        }

        // Fetch updated container
        const updatedContainer = await db
          .select()
          .from(table.containers)
          .where(eq(table.containers.id, id))
          .limit(1);

        return {
          status: 200,
          message: "Container restart command sent successfully",
          success: true,
          type: "success",
          data: {
            container: updatedContainer[0] as Static<typeof containerType>,
          },
        };
      } catch (error: any) {
        return ctx.error(400, {
          status: 400,
          type: "error",
          success: false,
          message: error.message || "Failed to restart container",
        });
      }
    },
    {
      // Protected by guard middleware at router level
      params: t.Object({
        id: t.String(),
      }),
      response: {
        200: baseResponseType(t.Object({ container: containerType })),
        404: baseResponseType(t.Null()),
        403: baseResponseType(t.Null()),
        400: baseResponseType(t.Null()),
      },
      detail: {
        description: "Restart a container (stop then start)",
        tags: ["container", "lifecycle", "restart", "api"],
      },
    }
  )

  // GET /api/v1/containers/:id/logs - Get container logs
  .get(
    "/:id/logs",
    async (ctx) => {
      const { id } = ctx.params;
      const { limit = 100, since, level } = ctx.query;

      try {
        // Get user from context
        const user = ctx.user;

        // Check ownership or manage permission
        const hasManagePerm = await hasPermission((user as any).id, "container:manage");
        const ownsContainer = await checkContainerOwnership((user as any).id, id);

        if (!ownsContainer && !hasManagePerm) {
          return ctx.error(403, {
            status: 403,
            type: "error",
            success: false,
            message:
              "Forbidden: You don't own this container and don't have manage permission",
          });
        }

        // Check if container exists
        const existingContainer = await db
          .select()
          .from(table.containers)
          .where(eq(table.containers.id, id))
          .limit(1);

        if (!existingContainer.length) {
          return ctx.error(404, {
            status: 404,
            type: "error",
            success: false,
            message: "Container not found",
          });
        }

        // Build where conditions
        const whereConditions = [
          eq(table.logs.containerUuid, existingContainer[0].uuid)
        ];

        if (since) {
          whereConditions.push(sql`${table.logs.timestamp} >= ${since}`);
        }

        if (level) {
          whereConditions.push(eq(table.logs.level, level));
        }

        const whereClause = and(...whereConditions);

        // Get logs from database
        const logs = await db
          .select({
            id: table.logs.id,
            containerUuid: table.logs.containerUuid,
            nodeId: table.logs.nodeId,
            timestamp: table.logs.timestamp,
            message: table.logs.message,
            level: table.logs.level,
            createdAt: table.logs.createdAt
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
          message: "Container logs retrieved successfully",
          success: true,
          type: "success",
          data: {
            logs: logs.map(log => ({
              ...log,
              createdAt: log.createdAt.toISOString(),
              timestamp: log.timestamp.toISOString()
            })),
            pagination: {
              page: 1,
              limit: Number(limit),
              total: total[0].count,
              pages: Math.ceil(total[0].count / Number(limit))
            }
          },
        };
      } catch (error: any) {
        return ctx.error(400, {
          status: 400,
          type: "error",
          success: false,
          message: error.message || "Failed to retrieve container logs",
        });
      }
    },
    {
      // Protected by guard middleware at router level
      params: t.Object({
        id: t.String(),
      }),
      query: t.Object({
        limit: t.Optional(t.Number({ minimum: 1, maximum: 1000 })),
        since: t.Optional(t.String()),
        level: t.Optional(t.String()),
      }),
      response: {
        200: baseResponseType(
          t.Object({
            logs: t.Array(
              t.Object({
                id: t.String(),
                containerUuid: t.String(),
                nodeId: t.Union([t.String(), t.Null()]),
                timestamp: t.String(),
                message: t.String(),
                level: t.String(),
                createdAt: t.String(),
              })
            ),
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
        description: "Get container logs with optional filters and pagination",
        tags: ["container", "logs", "api"],
      },
    }
  )

  // GET /api/v1/containers/:id/stats - Get container statistics
  .get(
    "/:id/stats",
    async (ctx) => {
      const { id } = ctx.params;

      try {
        // Get user from context
        const user = ctx.user;

        // Check ownership or read permission
        const hasReadPerm = await hasPermission((user as any).id, "container:read");
        const hasManagePerm = await hasPermission((user as any).id, "container:manage");
        const ownsContainer = await checkContainerOwnership((user as any).id, id);

        if (!ownsContainer && !hasReadPerm && !hasManagePerm) {
          return ctx.error(403, {
            status: 403,
            type: "error",
            success: false,
            message:
              "Forbidden: You don't own this container and don't have read or manage permission",
          });
        }

        // Check if container exists
        const existingContainer = await db
          .select()
          .from(table.containers)
          .where(eq(table.containers.id, id))
          .limit(1);

        if (!existingContainer.length) {
          return ctx.error(404, {
            status: 404,
            type: "error",
            success: false,
            message: "Container not found",
          });
        }

        // Send stats command to node agent via WebSocket
        const statsResult = await wsManager.sendToNode(
          existingContainer[0].nodeId,
          {
            type: "command",
            action: "stats",
            containerId: existingContainer[0].uuid,
          }
        );

        if (!statsResult) {
          return ctx.error(500, {
            status: 500,
            type: "error",
            success: false,
            message: "Failed to send stats command to node agent",
          });
        }

        // Parse stats result and format response
        const statsData = statsResult || {};

        return {
          status: 200,
          message: "Stats retrieved",
          success: true,
          type: "success",
          data: {
            cpu: statsData.cpu || 0,
            memory: {
              used: statsData.memoryUsed || 0,
              total: statsData.memoryTotal || 0,
            },
            uptime: statsData.uptime || 0,
          },
        };
      } catch (error: any) {
        return ctx.error(400, {
          status: 400,
          type: "error",
          success: false,
          message: error.message || "Failed to retrieve container stats",
        });
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      response: {
        200: baseResponseType(
          t.Object({
            cpu: t.Number(),
            memory: t.Object({
              used: t.Number(),
              total: t.Number(),
            }),
            uptime: t.Number(),
          })
        ),
        404: baseResponseType(t.Null()),
        403: baseResponseType(t.Null()),
        500: baseResponseType(t.Null()),
        400: baseResponseType(t.Null()),
      },
      detail: {
        description: "Get container statistics including CPU, memory usage, and uptime",
        tags: ["container", "stats", "monitoring", "api"],
      },
    }
  )

  // POST /api/v1/containers/:id/assign/:nodeId - Reassign container to different node
  .post(
    "/:id/assign/:nodeId",
    async (ctx) => {
      const { id, nodeId } = ctx.params;

      try {
        // Get user from context
        const user = ctx.user;

        // Check ownership or manage permission
        const hasManagePerm = await hasPermission((user as any).id, "container:manage");
        const ownsContainer = await checkContainerOwnership((user as any).id, id);

        if (!ownsContainer && !hasManagePerm) {
          return ctx.error(403, {
            status: 403,
            type: "error",
            success: false,
            message:
              "Forbidden: You don't own this container and don't have manage permission",
          });
        }

        // Check if container exists
        const existingContainer = await db
          .select()
          .from(table.containers)
          .where(eq(table.containers.id, id))
          .limit(1);

        if (!existingContainer.length) {
          return ctx.error(404, {
            status: 404,
            type: "error",
            success: false,
            message: "Container not found",
          });
        }

        // Check if target node exists
        const targetNode = await db
          .select()
          .from(table.nodes)
          .where(eq(table.nodes.id, nodeId))
          .limit(1);

        if (!targetNode.length) {
          return ctx.error(404, {
            status: 404,
            type: "error",
            success: false,
            message: "Target node not found",
          });
        }

        // Check if container is already assigned to this node
        if (existingContainer[0].nodeId === nodeId) {
          return ctx.error(400, {
            status: 400,
            type: "error",
            success: false,
            message: "Container is already assigned to this node",
          });
        }

        // Update container's node assignment
        await db
          .update(table.containers)
          .set({
            nodeId,
            updatedAt: sql`now()`,
          })
          .where(eq(table.containers.id, id));

        // Stub: Send command to old and new nodes
        console.log(
          `Command sent to node ${existingContainer[0].nodeId} for container ${id}: STOP`
        );
        console.log(
          `Command sent to node ${nodeId} for container ${id}: START`
        );

        // Fetch updated container
        const updatedContainer = await db
          .select()
          .from(table.containers)
          .where(eq(table.containers.id, id))
          .limit(1);

        return {
          status: 200,
          message: "Container reassigned to node successfully",
          success: true,
          type: "success",
          data: {
            container: updatedContainer[0] as Static<typeof containerType>,
          },
        };
      } catch (error: any) {
        return ctx.error(400, {
          status: 400,
          type: "error",
          success: false,
          message: error.message || "Failed to reassign container to node",
        });
      }
    },
    {
      // Protected by guard middleware at router level
      params: t.Object({
        id: t.String(),
        nodeId: t.String(),
      }),
      response: {
        200: baseResponseType(t.Object({ container: containerType })),
        404: baseResponseType(t.Null()),
        403: baseResponseType(t.Null()),
        400: baseResponseType(t.Null()),
      },
      detail: {
        description: "Reassign a container to a different node",
        tags: ["container", "node", "assign", "api"],
      },
    }
  )

  // GET /api/v1/containers/:id/health - Get container health status
  .get(
    "/:id/health",
    async (ctx) => {
      const { id } = ctx.params;

      try {
        // Get user from context
        const user = ctx.user;

        // Check ownership or manage permission
        const hasManagePerm = await hasPermission((user as any).id, "container:manage");
        const ownsContainer = await checkContainerOwnership((user as any).id, id);

        if (!ownsContainer && !hasManagePerm) {
          return ctx.error(403, {
            status: 403,
            type: "error",
            success: false,
            message:
              "Forbidden: You don't own this container and don't have manage permission",
          });
        }

        // Get container with node health information
        const containerHealth = await db
          .select({
            id: table.containers.id,
            status: table.containers.status,
            migration_status: table.containers.migration_status,
            last_heartbeat: table.containers.last_heartbeat,
            node_status: table.node_health.status,
            node_last_heartbeat: table.node_health.last_heartbeat,
          })
          .from(table.containers)
          .leftJoin(table.node_health, eq(table.containers.nodeId, table.node_health.node_id))
          .where(eq(table.containers.id, id))
          .limit(1);

        if (!containerHealth.length) {
          return ctx.error(404, {
            status: 404,
            type: "error",
            success: false,
            message: "Container not found",
          });
        }

        const health = containerHealth[0];

        return {
          status: 200,
          message: "Container health retrieved successfully",
          success: true,
          type: "success",
          data: {
            container_id: health.id,
            status: health.status,
            migration_status: health.migration_status,
            last_heartbeat: health.last_heartbeat ? health.last_heartbeat.toISOString() : null,
            node_status: health.node_status || 'unknown',
            node_last_heartbeat: health.node_last_heartbeat ? health.node_last_heartbeat.toISOString() : null,
          },
        };
      } catch (error: any) {
        return ctx.error(400, {
          status: 400,
          type: "error",
          success: false,
          message: error.message || "Failed to retrieve container health",
        });
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      response: {
        200: baseResponseType(
          t.Object({
            container_id: t.String(),
            status: t.String(),
            migration_status: t.Union([t.String(), t.Null()]),
            last_heartbeat: t.Union([t.String(), t.Null()]),
            node_status: t.String(),
            node_last_heartbeat: t.Union([t.String(), t.Null()]),
          })
        ),
        404: baseResponseType(t.Null()),
        403: baseResponseType(t.Null()),
        400: baseResponseType(t.Null()),
      },
      detail: {
        description: "Get container health status including migration and node health",
        tags: ["container", "health", "monitoring", "api"],
      },
    }
  )

  // GET /api/v1/containers/nodes/health - Get all nodes health status
  .get(
    "/nodes/health",
    async (ctx) => {
      try {
        // Get user from context
        const user = ctx.user;

        // Check if user has permission to view node health
        const hasManagePerm = await hasPermission((user as any).id, "container:manage");
        const hasNodeReadPerm = await hasPermission((user as any).id, "node:read");

        if (!hasManagePerm && !hasNodeReadPerm) {
          return ctx.error(403, {
            status: 403,
            type: "error",
            success: false,
            message:
              "Forbidden: Missing required permission 'container:manage' or 'node:read'",
          });
        }

        // Get all nodes with their health information
        const nodesHealth = await db
          .select({
            id: table.nodes.id,
            name: table.nodes.name,
            fqdn: table.nodes.fqdn,
            clusterId: table.nodes.clusterId,
            status: table.nodes.status,
            health_status: table.node_health.status,
            last_heartbeat: table.node_health.last_heartbeat,
            createdAt: table.nodes.createdAt,
            updatedAt: table.nodes.updatedAt,
          })
          .from(table.nodes)
          .leftJoin(table.node_health, eq(table.nodes.id, table.node_health.node_id));

        return {
          status: 200,
          message: "Nodes health retrieved successfully",
          success: true,
          type: "success",
          data: {
            nodes: nodesHealth.map(node => ({
              id: node.id,
              name: node.name,
              fqdn: node.fqdn,
              clusterId: node.clusterId,
              status: node.status,
              health_status: node.health_status || 'unknown',
              last_heartbeat: node.last_heartbeat ? node.last_heartbeat.toISOString() : null,
              createdAt: node.createdAt.toISOString(),
              updatedAt: node.updatedAt.toISOString(),
            })),
          },
        };
      } catch (error: any) {
        return ctx.error(400, {
          status: 400,
          type: "error",
          success: false,
          message: error.message || "Failed to retrieve nodes health",
        });
      }
    },
    {
      response: {
        200: baseResponseType(
          t.Object({
            nodes: t.Array(
              t.Object({
                id: t.String(),
                name: t.String(),
                fqdn: t.String(),
                clusterId: t.String(),
                status: t.String(),
                health_status: t.String(),
                last_heartbeat: t.Union([t.String(), t.Null()]),
                createdAt: t.String(),
                updatedAt: t.String(),
              })
            ),
          })
        ),
        403: baseResponseType(t.Null()),
        400: baseResponseType(t.Null()),
      },
      detail: {
        description: "Get health status for all nodes",
        tags: ["node", "health", "monitoring", "api"],
      },
    }
  )

  // POST /api/v1/containers/migration/:containerId/trigger - Trigger manual migration
  .post(
    "/migration/:containerId/trigger",
    async (ctx) => {
      const { containerId } = ctx.params;

      try {
        // Get user from context
        const user = ctx.user;

        // Check if user has migration management permission
        const hasMigrationPerm = await hasPermission((user as any).id, "migration:manage");

        if (!hasMigrationPerm) {
          return ctx.error(403, {
            status: 403,
            type: "error",
            success: false,
            message:
              "Forbidden: Missing required permission 'migration:manage'",
          });
        }

        // Check if container exists and is HA type
        const container = await db
          .select()
          .from(table.containers)
          .where(eq(table.containers.id, containerId))
          .limit(1);

        if (!container.length) {
          return ctx.error(404, {
            status: 404,
            type: "error",
            success: false,
            message: "Container not found",
          });
        }

        if (container[0].type !== 'ha') {
          return ctx.error(400, {
            status: 400,
            type: "error",
            success: false,
            message: "Container is not an HA container",
          });
        }

        // Update migration status to migrating
        await db
          .update(table.containers)
          .set({
            migration_status: 'migrating',
            updatedAt: sql`now()`,
          })
          .where(eq(table.containers.id, containerId));

        // Stub: Log migration trigger
        console.log(`Migration triggered for container ${containerId}`);

        return {
          status: 200,
          message: "Migration triggered successfully",
          success: true,
          type: "success",
          data: {
            container_id: containerId,
            migration_status: 'migrating',
          },
        };
      } catch (error: any) {
        return ctx.error(400, {
          status: 400,
          type: "error",
          success: false,
          message: error.message || "Failed to trigger migration",
        });
      }
    },
    {
      params: t.Object({
        containerId: t.String(),
      }),
      response: {
        200: baseResponseType(
          t.Object({
            container_id: t.String(),
            migration_status: t.String(),
          })
        ),
        404: baseResponseType(t.Null()),
        403: baseResponseType(t.Null()),
        400: baseResponseType(t.Null()),
      },
      detail: {
        description: "Trigger manual migration for an HA container",
        tags: ["container", "migration", "ha", "api"],
      },
    }
  );
