import Elysia, { Static, t } from "elysia";
import { baseResponseType } from "../types";
import { table } from "../database/schema";
import { db } from "../database";
import { eq, desc, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import { createPermissionResolve } from "../middlewares/permissions-guard";

const nodeType = t.Object({
  id: t.String(),
  name: t.String(),
  fqdn: t.String(),
  clusterId: t.String(),
  status: t.String(),
  createdAt: t.Date(),
  updatedAt: t.Date()
});

const nodeListType = t.Object({
  id: t.String(),
  name: t.String(),
  fqdn: t.String(),
  clusterId: t.String(),
  status: t.String(),
  createdAt: t.Date(),
  updatedAt: t.Date()
});

const createNodeType = t.Object({
  name: t.String({ minLength: 1, maxLength: 255 }),
  fqdn: t.String({ minLength: 1, maxLength: 255 }),
  clusterId: t.String()
});

const updateNodeType = t.Object({
  name: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
  fqdn: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
  status: t.Optional(t.String({ enum: ["online", "offline", "maintenance"] }))
});

export const nodesRouter = new Elysia({ prefix: "/nodes" })
  .resolve(createPermissionResolve("node:read"))
  // GET /api/v1/nodes - List all nodes (paginated, optional cluster filter)
  .get("/", async (ctx) => {

    const { page = 1, limit = 10, clusterId } = ctx.query;
    const offset = (page - 1) * limit;

    // Build the base query for nodes
    const nodes = await db
      .select()
      .from(table.nodes)
      .where(clusterId ? eq(table.nodes.clusterId, clusterId) : undefined)
      .orderBy(desc(table.nodes.createdAt))
      .limit(limit)
      .offset(offset);

    // Build count query with same filters
    const total = await db
      .select({ count: sql<number>`count(*)` })
      .from(table.nodes)
      .where(clusterId ? eq(table.nodes.clusterId, clusterId) : undefined);

    return {
      status: 200,
      message: "Nodes fetched successfully",
      success: true,
      type: "success",
      data: {
        nodes: nodes as Static<typeof nodeListType>[],
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: total[0].count,
          pages: Math.ceil(total[0].count / limit)
        }
      }
    }
  }, {
    query: t.Object({
      page: t.Optional(t.Number({ minimum: 1 })),
      limit: t.Optional(t.Number({ minimum: 1, maximum: 100 })),
      clusterId: t.Optional(t.String())
    }),
    response: {
      200: baseResponseType(t.Object({
        nodes: t.Array(nodeListType),
        pagination: t.Object({
          page: t.Number(),
          limit: t.Number(),
          total: t.Number(),
          pages: t.Number()
        })
      }))
    },
    detail: {
      description: "List all nodes with optional cluster filter and pagination",
      tags: ["node", "list", "api"]
    }
  })


  // Write operations (POST, PUT, DELETE) - require node:write permission
  .resolve(createPermissionResolve("node:write"))
  .post("/", async (ctx) => {
    const { name, fqdn, clusterId } = ctx.body;

    try {
      // Check if cluster exists
      const existingCluster = await db
        .select()
        .from(table.clusters)
        .where(eq(table.clusters.id, clusterId))
        .limit(1);

      if (!existingCluster.length) {
        return ctx.error(404, {
          status: 404,
          type: "error",
          success: false,
          message: "Cluster not found"
        });
      }

      // Check if FQDN already exists
      const existingNode = await db
        .select()
        .from(table.nodes)
        .where(eq(table.nodes.fqdn, fqdn))
        .limit(1);

      if (existingNode.length) {
        return ctx.error(400, {
          status: 400,
          type: "error",
          success: false,
          message: "Node with this FQDN already exists"
        });
      }

      // Generate token for node authentication
      const token = randomUUID();

      const newNode = await db.insert(table.nodes).values({
        id: randomUUID(),
        name,
        fqdn,
        clusterId,
        token
      }).returning();

      // Return node without token for security
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { token: _, ...nodeWithoutToken } = newNode[0];

      return {
        status: 201,
        message: "Node created successfully",
        success: true,
        type: "success",
        data: {
          node: nodeWithoutToken as Static<typeof nodeType>
        }
      }
    } catch (error: any) {
      return ctx.error(400, {
        status: 400,
        type: "error",
        success: false,
        message: error.message || "Failed to create node"
      });
    }
  }, {
    body: createNodeType,
    response: {
      201: baseResponseType(t.Object({ node: nodeType })),
      404: baseResponseType(t.Null()),
      400: baseResponseType(t.Null())
    },
    detail: {
      description: "Create a new node with auto-generated authentication token",
      tags: ["node", "create", "api"]
    }
  })

  // PUT /api/v1/nodes/:id - Update node
  .put("/:id", async (ctx) => {
    const { id } = ctx.params;
    const { name, fqdn, status } = ctx.body;

    try {
      // Check if node exists
      const existingNode = await db
        .select()
        .from(table.nodes)
        .where(eq(table.nodes.id, id))
        .limit(1);

      if (!existingNode.length) {
        return ctx.error(404, {
          status: 404,
          type: "error",
          success: false,
          message: "Node not found"
        });
      }

      // Update node data
      const updateData: any = {
        updatedAt: sql`now()`
      };

      if (name) updateData.name = name;
      if (fqdn) {
        // Check if FQDN already exists for another node
        const existingFqdn = await db
          .select()
          .from(table.nodes)
          .where(eq(table.nodes.fqdn, fqdn))
          .limit(1);

        if (existingFqdn.length && existingFqdn[0].id !== id) {
          return ctx.error(400, {
            status: 400,
            type: "error",
            success: false,
            message: "FQDN already exists for another node"
          });
        }
        updateData.fqdn = fqdn;
      }
      if (status) updateData.status = status;

      await db
        .update(table.nodes)
        .set(updateData)
        .where(eq(table.nodes.id, id));

      // Fetch updated node
      const updatedNode = await db
        .select()
        .from(table.nodes)
        .where(eq(table.nodes.id, id))
        .limit(1);

      // Return node without token for security
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { token: _, ...nodeWithoutToken } = updatedNode[0];

      return {
        status: 200,
        message: "Node updated successfully",
        success: true,
        type: "success",
        data: {
          node: nodeWithoutToken as Static<typeof nodeType>
        }
      }
    } catch (error: any) {
      return ctx.error(400, {
        status: 400,
        type: "error",
        success: false,
        message: error.message || "Failed to update node"
      });
    }
  }, {
    params: t.Object({
      id: t.String()
    }),
    body: updateNodeType,
    response: {
      200: baseResponseType(t.Object({ node: nodeType })),
      404: baseResponseType(t.Null()),
      400: baseResponseType(t.Null())
    },
    detail: {
      description: "Update a node (status, name, or FQDN)",
      tags: ["node", "update", "api"]
    }
  })

  // DELETE /api/v1/nodes/:id - Delete node
  .delete("/:id", async (ctx) => {
    const { id } = ctx.params;

    try {
      // Check if node exists
      const existingNode = await db
        .select()
        .from(table.nodes)
        .where(eq(table.nodes.id, id))
        .limit(1);

      if (!existingNode.length) {
        return ctx.error(404, {
          status: 404,
          type: "error",
          success: false,
          message: "Node not found"
        });
      }

      // Delete node (cascade will handle related records)
      await db.delete(table.nodes).where(eq(table.nodes.id, id));

      return {
        status: 200,
        message: "Node deleted successfully",
        success: true,
        type: "success",
        data: null
      }
    } catch (error: any) {
      return ctx.error(400, {
        status: 400,
        type: "error",
        success: false,
        message: error.message || "Failed to delete node"
      });
    }
  }, {
    params: t.Object({
      id: t.String()
    }),
    response: {
      200: baseResponseType(t.Null()),
      404: baseResponseType(t.Null()),
      400: baseResponseType(t.Null())
    },
    detail: {
      description: "Delete a node",
      tags: ["node", "delete", "api"]
    }
  })

  // POST /api/v1/clusters/:clusterId/nodes/:nodeId - Assign node to cluster
  .post("/assign/:clusterId/:nodeId", async (ctx) => {
    const { clusterId, nodeId } = ctx.params;

    try {
      // Check if cluster exists
      const existingCluster = await db
        .select()
        .from(table.clusters)
        .where(eq(table.clusters.id, clusterId))
        .limit(1);

      if (!existingCluster.length) {
        return ctx.error(404, {
          status: 404,
          type: "error",
          success: false,
          message: "Cluster not found"
        });
      }

      // Check if node exists
      const existingNode = await db
        .select()
        .from(table.nodes)
        .where(eq(table.nodes.id, nodeId))
        .limit(1);

      if (!existingNode.length) {
        return ctx.error(404, {
          status: 404,
          type: "error",
          success: false,
          message: "Node not found"
        });
      }

      // Check if node is already assigned to this cluster
      if (existingNode[0].clusterId === clusterId) {
        return ctx.error(400, {
          status: 400,
          type: "error",
          success: false,
          message: "Node is already assigned to this cluster"
        });
      }

      // Update node's cluster assignment
      await db
        .update(table.nodes)
        .set({
          clusterId,
          updatedAt: sql`now()`
        })
        .where(eq(table.nodes.id, nodeId));

      // Fetch updated node
      const updatedNode = await db
        .select()
        .from(table.nodes)
        .where(eq(table.nodes.id, nodeId))
        .limit(1);

      // Return node without token for security
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { token: _, ...nodeWithoutToken } = updatedNode[0];

      return {
        status: 200,
        message: "Node assigned to cluster successfully",
        success: true,
        type: "success",
        data: {
          node: nodeWithoutToken as Static<typeof nodeType>
        }
      }
    } catch (error: any) {
      return ctx.error(400, {
        status: 400,
        type: "error",
        success: false,
        message: error.message || "Failed to assign node to cluster"
      });
    }
  }, {
    params: t.Object({
      clusterId: t.String(),
      nodeId: t.String()
    }),
    response: {
      200: baseResponseType(t.Object({ node: nodeType })),
      404: baseResponseType(t.Null()),
      400: baseResponseType(t.Null())
    },
    detail: {
      description: "Assign a node to a cluster",
      tags: ["node", "cluster", "assign", "api"]
    }
  });