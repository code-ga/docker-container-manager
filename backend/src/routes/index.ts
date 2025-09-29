import Elysia from "elysia";
import betterAuthView from "../libs/auth/auth-view";
import { createPermissionResolve } from "../middlewares/permissions-guard";
import { clustersRouter } from "./clusters";
import { containersRouter } from "./containers";
import { eggsRouter } from "./eggs";
import { nodesRouter } from "./nodes";
import { rolesRouter } from "./roles";
import { userRouter } from "./user";
import { db } from "../database";
import { sql } from "drizzle-orm";

const apiRouter = new Elysia({
  prefix: "/api", detail: {
    description: "API For The Forum to help you create your own forum with in a few minutes (using better auth for the authentication auth docs is here /api/auth/reference)",
    tags: ["api"]
  }
})
  .all("/auth/*", betterAuthView)

  // Health check route (public, no authentication required)
  .get("/health", async () => {
    try {
      // Simple database check - try to query a system table
      await db.select({ count: sql`1` }).from(sql`information_schema.tables`).limit(1);

      return {
        status: "ok",
        timestamp: new Date().toISOString(),
        database: "connected"
      };
    } catch (error) {
      return {
        status: "error",
        timestamp: new Date().toISOString(),
        database: "disconnected",
        error: error instanceof Error ? error.message : "Unknown database error"
      };
    }
  }, {
    detail: {
      description: "Health check endpoint",
      tags: ["health"]
    }
  })

  // Public routes (no authentication required)
  .use(userRouter)

  // Protected routes with role-based permissions
  .resolve(createPermissionResolve("user:read"))
  .use(rolesRouter)

  // Cluster management routes - requires cluster management permissions
  .resolve(createPermissionResolve("cluster:manage"))
  .use(clustersRouter)

  // Node management routes - requires node management permissions
  .resolve(createPermissionResolve("node:manage"))
  .use(nodesRouter)

  // Egg management routes - requires egg management permissions
  .resolve(createPermissionResolve("egg:manage"))
  .use(eggsRouter)

  // Container management routes - requires container management permissions
  .resolve(createPermissionResolve("container:manage"))
  .use(containersRouter)

export default apiRouter