import { db } from "../database";
import { table } from "../database/schema";
import { eq, sql, desc, and, gte } from "drizzle-orm";
import { wsManager } from "../libs/websocket";
import { logger } from "./logger";

/**
 * Migration service for HA containers
 * Handles container migration between nodes when nodes become unhealthy
 */
export async function migrateContainer(containerId: string): Promise<void> {
  let oldNodeId: string | null = null;
  let newNodeId: string | null = null;
  let container: any = null;

  try {
    logger.info(`Starting migration for container ${containerId}`, {}, { module: 'migration', function: 'migrateContainer' });

    // Step 1: Query container to ensure it's 'ha' and not migrating
    const containers = await db
      .select()
      .from(table.containers)
      .where(eq(table.containers.id, containerId))
      .limit(1);

    if (!containers.length) {
      logger.error(`Container ${containerId} not found`, {}, { module: 'migration', function: 'migrateContainer' });
      return;
    }

    container = containers[0];
    oldNodeId = container.nodeId;

    // Only migrate HA containers
    if (container.type !== 'ha') {
      logger.info(`Container ${containerId} is not an HA container, skipping migration`, {}, { module: 'migration', function: 'migrateContainer' });
      return;
    }

    // Check if already migrating
    if (container.migration_status === 'migrating') {
      logger.info(`Container ${containerId} is already migrating, skipping`, {}, { module: 'migration', function: 'migrateContainer' });
      return;
    }

    // Update migration status to migrating
    await db
      .update(table.containers)
      .set({
        migration_status: 'migrating',
        updatedAt: sql`now()`
      })
      .where(eq(table.containers.id, containerId));

    // Step 2: Get current node_id and query healthy nodes
    logger.info(`Current node: ${oldNodeId}`, {}, { module: 'migration', function: 'migrateContainer' });

    // Query healthy nodes with recent heartbeat (within last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const healthyNodes = await db
      .select({
        node_id: table.node_health.node_id,
        cluster_id: table.nodes.clusterId,
        status: table.node_health.status,
        last_heartbeat: table.node_health.last_heartbeat
      })
      .from(table.node_health)
      .innerJoin(table.nodes, eq(table.node_health.node_id, table.nodes.id))
      .where(
        and(
          eq(table.node_health.status, 'healthy'),
          gte(table.node_health.last_heartbeat, fiveMinutesAgo)
        )
      )
      .orderBy(desc(table.node_health.last_heartbeat));

    if (healthyNodes.length === 0) {
      logger.error('No healthy nodes available for migration', {}, { module: 'migration', function: 'migrateContainer' });
      throw new Error('No healthy nodes available');
    }

    // Step 3: Select target node - prefer same cluster, then any healthy node
    let targetNode = null;

    // First, try to find a node in the same cluster (excluding current node)
    if (container.preferred_cluster_id) {
      targetNode = healthyNodes.find(node =>
        node.cluster_id === container.preferred_cluster_id &&
        node.node_id !== oldNodeId
      );
    }

    // If no node in preferred cluster, select any healthy node (excluding current)
    if (!targetNode) {
      targetNode = healthyNodes.find(node => node.node_id !== oldNodeId);
    }

    if (!targetNode) {
      logger.error('No suitable target node found for migration', {}, { module: 'migration', function: 'migrateContainer' });
      throw new Error('No suitable target node found');
    }

    newNodeId = targetNode.node_id;
    logger.info(`Selected target node ${newNodeId} for migration`, {}, { module: 'migration', function: 'migrateContainer' });

    // Step 4: Stub capacity check - assume all healthy nodes have enough capacity
    logger.info(`Assuming target node ${newNodeId} has sufficient capacity`, {}, { module: 'migration', function: 'migrateContainer' });

    // Step 5: Send 'stop' command to old node
    logger.info(`Stopping container ${containerId} on old node ${oldNodeId}`, {}, { module: 'migration', function: 'migrateContainer' });
    if (!oldNodeId) {
      throw new Error('Old node ID is null');
    }

    try {
      await wsManager.sendToNode(oldNodeId, {
        type: 'command',
        action: 'stop',
        containerId: container.uuid
      });
      logger.info(`Successfully stopped container ${containerId} on old node`, {}, { module: 'migration', function: 'migrateContainer' });
    } catch (error) {
      logger.error(`Failed to stop container ${containerId} on old node`, { error: error instanceof Error ? error.message : String(error) }, { module: 'migration', function: 'migrateContainer' });
      throw error;
    }

    // Step 6: Send 'create' command to new node with copied config
    logger.info(`Creating container ${containerId} on new node ${newNodeId}`, {}, { module: 'migration', function: 'migrateContainer' });

    // Get egg configuration for the container
    const eggs = await db
      .select()
      .from(table.eggs)
      .where(eq(table.eggs.id, container.eggId))
      .limit(1);

    if (!eggs.length) {
      throw new Error(`Egg ${container.eggId} not found`);
    }

    const egg = eggs[0];

    try {
      await wsManager.sendToNode(newNodeId, {
        type: 'command',
        action: 'create',
        containerId: container.uuid,
        eggConfig: {
          image: egg.image,
          ports: container.ports || {},
          volumes: container.volumes || [],
          startupCommand: egg.startupCommand || undefined,
          envVars: egg.envVars || {}
        },
        resources: {
          cpu: container.cpuLimit || 1,
          memory: container.memoryLimit ? `${container.memoryLimit}MB` : '512MB',
          disk: container.diskLimit ? `${container.diskLimit}MB` : '1GB'
        },
        environment: container.environment || {}
      });
      logger.info(`Successfully created container ${containerId} on new node`, {}, { module: 'migration', function: 'migrateContainer' });
    } catch (error) {
      logger.error(`Failed to create container ${containerId} on new node`, { error: error instanceof Error ? error.message : String(error) }, { module: 'migration', function: 'migrateContainer' });
      throw error;
    }

    // Step 7: Update database - container node_id, migration_status = 'completed'
    await db
      .update(table.containers)
      .set({
        nodeId: newNodeId,
        migration_status: 'idle',
        updatedAt: sql`now()`
      })
      .where(eq(table.containers.id, containerId));

    // Step 8: Insert migration history record
    await db
      .insert(table.container_migration_history)
      .values({
        container_id: containerId,
        from_node_id: oldNodeId,
        to_node_id: newNodeId,
        status: 'completed'
      });

    logger.info(`Migration completed successfully for container ${containerId} from ${oldNodeId} to ${newNodeId}`, {}, { module: 'migration', function: 'migrateContainer' });

  } catch (error) {
    logger.error(`Migration failed for container ${containerId}`, { error: error instanceof Error ? error.message : String(error) }, { module: 'migration', function: 'migrateContainer' });

    // Rollback logic
    try {
      if (newNodeId && container) {
        logger.warn(`Attempting rollback: stopping container on new node ${newNodeId}`, {}, { module: 'migration', function: 'migrateContainer' });
        try {
          await wsManager.sendToNode(newNodeId, {
            type: 'command',
            action: 'stop',
            containerId: container.uuid
          });
        } catch (rollbackError) {
          logger.error(`Rollback stop failed`, { error: rollbackError instanceof Error ? rollbackError.message : String(rollbackError) }, { module: 'migration', function: 'migrateContainer' });
        }
      }

      if (oldNodeId && container) {
        logger.warn(`Attempting rollback: restarting container on old node ${oldNodeId}`, {}, { module: 'migration', function: 'migrateContainer' });
        try {
          await wsManager.sendToNode(oldNodeId, {
            type: 'command',
            action: 'start',
            containerId: container.uuid
          });
        } catch (rollbackError) {
          logger.error(`Rollback start failed`, { error: rollbackError instanceof Error ? rollbackError.message : String(rollbackError) }, { module: 'migration', function: 'migrateContainer' });
        }
      }
    } catch (rollbackError) {
      logger.error(`Rollback failed`, { error: rollbackError instanceof Error ? rollbackError.message : String(rollbackError) }, { module: 'migration', function: 'migrateContainer' });
    }

    // Update migration status to failed
    if (containerId) {
      await db
        .update(table.containers)
        .set({
          migration_status: 'failed',
          updatedAt: sql`now()`
        })
        .where(eq(table.containers.id, containerId));

      // Insert failed migration history record
      if (oldNodeId && newNodeId) {
        await db
          .insert(table.container_migration_history)
          .values({
            container_id: containerId,
            from_node_id: oldNodeId,
            to_node_id: newNodeId,
            status: 'failed'
          });
      }
    }
  }
}