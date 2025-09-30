import Elysia, { Static, t } from "elysia";
import { baseResponseType } from "../types";
import { table } from "../database/schema";
import { db } from "../database";
import { eq, desc, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import { createPermissionResolve } from "../middlewares/permissions-guard";

const clusterType = t.Object({
  id: t.String(),
  name: t.String(),
  description: t.Optional(t.String()),
  createdAt: t.Date(),
  updatedAt: t.Date()
});

const createClusterType = t.Object({
  name: t.String({ minLength: 1, maxLength: 255 }),
  description: t.Optional(t.String())
});

const updateClusterType = t.Object({
  name: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
  description: t.Optional(t.String())
});

export const clustersRouter = new Elysia({ prefix: "/clusters" })
  .resolve(createPermissionResolve("cluster:read"))
  // GET /api/v1/clusters - List all clusters (paginated)
  .get("/", async (ctx) => {
    const { page = 1, limit = 10 } = ctx.query;
    const offset = (page - 1) * limit;

    const clusters = await db
      .select()
      .from(table.clusters)
      .orderBy(desc(table.clusters.createdAt))
      .limit(limit)
      .offset(offset);

    const total = await db
      .select({ count: sql<number>`count(*)` })
      .from(table.clusters);

    return {
      status: 200,
      message: "Clusters fetched successfully",
      success: true,
      type: "success",
      data: {
        clusters: clusters as Static<typeof clusterType>[],
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
      limit: t.Optional(t.Number({ minimum: 1, maximum: 100 }))
    }),
    response: {
      200: baseResponseType(t.Object({
        clusters: t.Array(clusterType),
        pagination: t.Object({
          page: t.Number(),
          limit: t.Number(),
          total: t.Number(),
          pages: t.Number()
        })
      }))
    },
    detail: {
      description: "List all clusters with pagination",
      tags: ["cluster", "list", "api"]
    }
  })


  // Write operations (POST, PUT, DELETE) - require cluster:write permission
  .resolve(createPermissionResolve("cluster:write"))
  .post("/", async (ctx) => {
    const { name, description } = ctx.body;

    try {
      const newCluster = await db.insert(table.clusters).values({
        id: randomUUID(),
        name,
        description: description || null
      }).returning();

      return {
        status: 201,
        message: "Cluster created successfully",
        success: true,
        type: "success",
        data: {
          cluster: newCluster[0] as Static<typeof clusterType>
        }
      }
    } catch (error: any) {
      return ctx.error(400, {
        status: 400,
        type: "error",
        success: false,
        message: error.message || "Failed to create cluster"
      });
    }
  }, {
    body: createClusterType,
    response: {
      201: baseResponseType(t.Object({ cluster: clusterType })),
      400: baseResponseType(t.Null())
    },
    detail: {
      description: "Create a new cluster",
      tags: ["cluster", "create", "api"]
    }
  })

  // PUT /api/v1/clusters/:id - Update cluster
  .put("/:id", async (ctx) => {
    const { id } = ctx.params;
    const { name, description } = ctx.body;

    try {
      // Check if cluster exists
      const existingCluster = await db
        .select()
        .from(table.clusters)
        .where(eq(table.clusters.id, id))
        .limit(1);

      if (!existingCluster.length) {
        return ctx.error(404, {
          status: 404,
          type: "error",
          success: false,
          message: "Cluster not found"
        });
      }

      // Update cluster data
      const updateData: any = {
        updatedAt: sql`now()`
      };

      if (name) updateData.name = name;
      if (description !== undefined) updateData.description = description;

      await db
        .update(table.clusters)
        .set(updateData)
        .where(eq(table.clusters.id, id));

      // Fetch updated cluster
      const updatedCluster = await db
        .select()
        .from(table.clusters)
        .where(eq(table.clusters.id, id))
        .limit(1);

      return {
        status: 200,
        message: "Cluster updated successfully",
        success: true,
        type: "success",
        data: {
          cluster: updatedCluster[0] as Static<typeof clusterType>
        }
      }
    } catch (error: any) {
      return ctx.error(400, {
        status: 400,
        type: "error",
        success: false,
        message: error.message || "Failed to update cluster"
      });
    }
  }, {
    params: t.Object({
      id: t.String()
    }),
    body: updateClusterType,
    response: {
      200: baseResponseType(t.Object({ cluster: clusterType })),
      404: baseResponseType(t.Null()),
      400: baseResponseType(t.Null())
    },
    detail: {
      description: "Update a cluster",
      tags: ["cluster", "update", "api"]
    }
  })

  // DELETE /api/v1/clusters/:id - Delete cluster
  .delete("/:id", async (ctx) => {
    const { id } = ctx.params;

    try {
      // Check if cluster exists
      const existingCluster = await db
        .select()
        .from(table.clusters)
        .where(eq(table.clusters.id, id))
        .limit(1);

      if (!existingCluster.length) {
        return ctx.error(404, {
          status: 404,
          type: "error",
          success: false,
          message: "Cluster not found"
        });
      }

      // Delete cluster (cascade will handle related records)
      await db.delete(table.clusters).where(eq(table.clusters.id, id));

      return {
        status: 200,
        message: "Cluster deleted successfully",
        success: true,
        type: "success",
        data: null
      }
    } catch (error: any) {
      return ctx.error(400, {
        status: 400,
        type: "error",
        success: false,
        message: error.message || "Failed to delete cluster"
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
      description: "Delete a cluster",
      tags: ["cluster", "delete", "api"]
    }
  });