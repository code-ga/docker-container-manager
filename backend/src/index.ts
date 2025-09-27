import cors from "@elysiajs/cors";
import swagger from "@elysiajs/swagger";
import { Elysia } from "elysia";
import apiRouter from "./routes";
import { OpenAPI } from "./libs/auth/openApi";
import { seedInitialData } from "./database/seed";
import { db } from "./database";
import { table } from "./database/schema";
import { eq, sql, and } from "drizzle-orm";
import { auth } from "./libs/auth/auth";
import { wsManager } from "./libs/websocket";
import { userMiddleware } from "./middlewares/auth-middleware";
import { migrateContainer } from "./utils/migration";
import { logger } from "./utils/logger";

const PORT = process.env.PORT || 3000;

// Initialize database and create superuser if needed
async function initializeApp() {
  try {
    // Seed initial data (permissions and roles)
    await seedInitialData();

    // Check if superuser exists
    const superUsers = await db
      .select({
        userId: table.userRoles.userId,
        userEmail: table.user.email,
        userName: table.user.name,
      })
      .from(table.userRoles)
      .innerJoin(table.roles, eq(table.userRoles.roleId, table.roles.id))
      .innerJoin(table.user, eq(table.userRoles.userId, table.user.id))
      .where(eq(table.roles.name, "superadmin"));

    if (superUsers.length === 0) {
      logger.info("No superuser found. Creating initial superuser...", {}, { module: 'index', function: 'initializeApp' });

      // Create superuser using Better-Auth
      const superUserEmail = process.env.SUPERUSER_EMAIL || "admin@lormas.com";
      const superUserPassword =
        process.env.SUPERUSER_PASSWORD || "ChangeMe123!";

      try {
        const user = await auth.api.signUpEmail({
          body: {
            email: superUserEmail,
            password: superUserPassword,
            name: "Super Administrator",
          },
        });

        if (user && user.user) {
          // Get the superadmin role ID
          const superAdminRole = await db
            .select()
            .from(table.roles)
            .where(eq(table.roles.name, "superadmin"))
            .limit(1);

          if (superAdminRole.length > 0) {
            // Assign superadmin role to the user
            await db.insert(table.userRoles).values({
              id: crypto.randomUUID(),
              userId: user.user.id,
              roleId: superAdminRole[0].id,
              createdAt: new Date(),
            });

            logger.info(`Superuser created successfully!`, {}, { module: 'index', function: 'initializeApp' });
            logger.info(`Email: ${superUserEmail}`, {}, { module: 'index', function: 'initializeApp' });
            logger.info(`Password: ${superUserPassword}`, {}, { module: 'index', function: 'initializeApp' });
            logger.warn(`Please change the default password after first login!`, {}, { module: 'index', function: 'initializeApp' });
          }
        }
      } catch (error) {
        logger.error("Error creating superuser", { error: error instanceof Error ? error.message : String(error) }, { module: 'index', function: 'initializeApp' });
        // Continue with server startup even if superuser creation fails
      }
    } else {
      logger.info("Superuser already exists, skipping creation", {}, { module: 'index', function: 'initializeApp' });
    }
  } catch (error) {
    logger.error("Error during app initialization", { error: error instanceof Error ? error.message : String(error) }, { module: 'index', function: 'initializeApp' });
    // Continue with server startup even if initialization fails
  }
}

// Initialize the app
initializeApp().catch((error) => logger.error("Error initializing app", { error: error instanceof Error ? error.message : String(error) }, { module: 'index' }));

// Health monitoring interval (every 30 seconds)
setInterval(async () => {
  try {
    const now = new Date();
    const thirtySecondsAgo = new Date(now.getTime() - 30 * 1000);

    // Find unhealthy nodes (last heartbeat > 30s ago)
    const unhealthyNodes = await db
      .select()
      .from(table.node_health)
      .where(sql`${table.node_health.last_heartbeat} < ${thirtySecondsAgo}`);

    for (const node of unhealthyNodes) {
      // Update node health status to unhealthy
      await db
        .update(table.node_health)
        .set({
          status: "unhealthy",
          updatedAt: sql`now()`,
        })
        .where(eq(table.node_health.node_id, node.node_id));

      logger.warn(`Node ${node.node_id} marked as unhealthy`, {}, { module: 'index', function: 'healthMonitoring' });

      // Find HA containers on this node
      const haContainers = await db
        .select()
        .from(table.containers)
        .where(
          and(
            eq(table.containers.nodeId, node.node_id),
            eq(table.containers.type, "ha")
          )
        );

      // Trigger migration for each HA container
      for (const container of haContainers) {
        logger.info(`Trigger migration for container ${container.id}`, {}, { module: 'index', function: 'healthMonitoring' });
        await migrateContainer(container.id);
      }
    }
  } catch (error) {
    logger.error("Error in health monitoring", { error: error instanceof Error ? error.message : String(error) }, { module: 'index', function: 'healthMonitoring' });
  }
}, 30000);

export const app = new Elysia()
  .get("/", () => "Hello Elysia")
  .use(cors())
  .use(
    swagger({
      version: "1.0.0",
      documentation: {
        info: {
          title: "API For The Forum",
          version: "1.0.0",
          description:
            "API For The Forum to help you create your own forum with in a few minutes",
        },
        tags: [
          {
            name: "auth",
            description:
              "Authentication endpoints (using better auth for the authentication auth docs is here /api/auth/reference)",
          },
        ],
        components: await OpenAPI.components,
        paths: await OpenAPI.getPaths(),
      },
    })
  )
  .ws("/api/ws/nodes", {
    open(ws: any) {
      // Handle new WebSocket connection
      wsManager.handleConnection(ws, ws.data.request);
    },
    message(ws, message) {
      // Handle incoming WebSocket messages
      const connectionType = (ws.data?.store as any)?.connectionType;
      if (connectionType === 'node') {
        const connectionId = (ws.data?.store as any)?.connectionId;
        if (connectionId) {
          wsManager.handleMessage(connectionId, message as string);
        }
      } else if (connectionType === 'client') {
        const userId = (ws.data?.store as any)?.userId;
        if (userId) {
          wsManager.handleClientMessage(userId, message as string);
        }
      }
    },
    close(ws: any) {
      // Handle connection cleanup
      const connectionType = (ws as any).data?.store?.connectionType;
      if (connectionType === 'node') {
        const nodeId = (ws as any).data?.store?.nodeId;
        const connectionId = (ws as any).data?.store?.connectionId;
        if (nodeId && connectionId) {
          wsManager.handleDisconnect(connectionId, nodeId);
        }
      } else if (connectionType === 'client') {
        const userId = (ws as any).data?.store?.userId;
        if (userId) {
          wsManager.handleClientDisconnect(userId);
        }
      }
    },
  })
  // Global auth resolve to set user context early
  .resolve(userMiddleware)
  .derive(({ user }) => ({ user }))
  .use(apiRouter)
  .listen(PORT);

logger.info(
  `Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
  {},
  { module: 'index' }
);

export type App = typeof app;
export * from "./types";
