import Elysia from "elysia";
import betterAuthView from "../libs/auth/auth-view";
import { userRouter } from "./user";
import { rolesRouter } from "./roles";
import { clustersRouter } from "./clusters";
import { nodesRouter } from "./nodes";
import { eggsRouter } from "./eggs";
import { containersRouter } from "./containers";
import { createPermissionResolve, createMultiPermissionResolve, createAnyPermissionResolve } from "../middlewares/permissions-guard";

const apiRouter = new Elysia({
  prefix: "/api", detail: {
    description: "API For The Forum to help you create your own forum with in a few minutes (using better auth for the authentication auth docs is here /api/auth/reference)",
    tags: ["api"]
  }
})
  .all("/auth/*", betterAuthView)

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