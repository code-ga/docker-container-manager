import { eq, sql } from 'drizzle-orm';
import { db } from './index';
import { table } from './schema';
import { logger } from '../utils/logger';

/**
 * Seed initial data including permissions and roles
 */
export async function seedInitialData() {
  try {
    logger.info('Starting database seeding...', {}, { module: 'seed', function: 'seedInitialData' });

    // Seed permissions
    const permissions = [
      // User permissions
      { name: 'user:*', description: 'All user permissions' },
      { name: 'user:read', description: 'Read user information' },
      { name: 'user:create', description: 'Create users' },
      { name: 'user:update', description: 'Update user information' },
      { name: 'user:delete', description: 'Delete users' },

      // Container permissions
      { name: 'container:*', description: 'All container permissions' },
      { name: 'container:own:*', description: 'All permissions for own containers' },
      { name: 'container:own:create', description: 'Create own containers' },
      { name: 'container:own:start', description: 'Start own containers' },
      { name: 'container:own:stop', description: 'Stop own containers' },
      { name: 'container:own:restart', description: 'Restart own containers' },
      { name: 'container:own:delete', description: 'Delete own containers' },
      { name: 'container:own:logs', description: 'View logs of own containers' },
      { name: 'container:own:exec', description: 'Execute commands in own containers' },
      { name: 'container:read', description: 'Read container information' },
      { name: 'container:update', description: 'Update container settings' },
      { name: 'container:ha:create', description: 'Create HA containers' },

      // Node permissions
      { name: 'node:*', description: 'All node permissions' },
      { name: 'node:read', description: 'Read node information' },
      { name: 'node:create', description: 'Create nodes' },
      { name: 'node:update', description: 'Update node settings' },
      { name: 'node:delete', description: 'Delete nodes' },
      { name: 'node:manage', description: 'Manage node resources' },

      // Cluster permissions
      { name: 'cluster:*', description: 'All cluster permissions' },
      { name: 'cluster:read', description: 'Read cluster information' },
      { name: 'cluster:create', description: 'Create clusters' },
      { name: 'cluster:update', description: 'Update cluster settings' },
      { name: 'cluster:delete', description: 'Delete clusters' },

      // Egg permissions
      { name: 'egg:*', description: 'All egg permissions' },
      { name: 'egg:read', description: 'Read egg information' },
      { name: 'egg:create', description: 'Create eggs' },
      { name: 'egg:update', description: 'Update egg settings' },
      { name: 'egg:delete', description: 'Delete eggs' },

      // Role permissions
      { name: 'role:*', description: 'All role permissions' },
      { name: 'role:read', description: 'Read role information' },
      { name: 'role:create', description: 'Create roles' },
      { name: 'role:update', description: 'Update role settings' },
      { name: 'role:delete', description: 'Delete roles' },
      { name: 'role:assign', description: 'Assign roles to users' },

      // Permission permissions
      { name: 'permission:*', description: 'All permission permissions' },
      { name: 'permission:read', description: 'Read permission information' },
      { name: 'permission:create', description: 'Create permissions' },
      { name: 'permission:update', description: 'Update permissions' },
      { name: 'permission:delete', description: 'Delete permissions' },

      // Migration permissions
      { name: 'migration:*', description: 'All migration permissions' },
      { name: 'migration:manage', description: 'Manage container migrations' },
    ];

    // Insert permissions if they don't exist
    for (const permission of permissions) {
      const existing = await db
        .select()
        .from(table.permissions)
        .where(eq(table.permissions.name, permission.name))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(table.permissions).values({
          id: crypto.randomUUID(),
          name: permission.name,
          description: permission.description,
          createdAt: sql`now()`,
          updatedAt: sql`now()`
        });
        logger.info(`Created permission: ${permission.name}`, {}, { module: 'seed', function: 'seedInitialData' });
      }
    }

    // Seed roles
    const roles = [
      {
        name: 'superadmin',
        description: 'Super administrator with all permissions',
        permissions: ['user:*', 'container:*', 'node:*', 'cluster:*', 'egg:*', 'role:*', 'permission:*', 'migration:*']
      },
      {
        name: 'user',
        description: 'Regular user with basic permissions',
        permissions: ['container:own:*', 'user:read']
      }
    ];

    // Insert roles and assign permissions
    for (const role of roles) {
      // Check if role exists
      const existingRole = await db
        .select()
        .from(table.roles)
        .where(eq(table.roles.name, role.name))
        .limit(1);

      let roleId: string;

      if (existingRole.length === 0) {
        // Create role
        const result = await db.insert(table.roles).values({
          id: crypto.randomUUID(),
          name: role.name,
          description: role.description,
          createdAt: sql`now()`,
          updatedAt: sql`now()`
        }).returning({ id: table.roles.id });

        roleId = result[0].id;
        logger.info(`Created role: ${role.name}`, {}, { module: 'seed', function: 'seedInitialData' });
      } else {
        roleId = existingRole[0].id;
        logger.info(`Role already exists: ${role.name}`, {}, { module: 'seed', function: 'seedInitialData' });
      }

      // Assign permissions to role
      for (const permissionName of role.permissions) {
        const permission = await db
          .select()
          .from(table.permissions)
          .where(eq(table.permissions.name, permissionName))
          .limit(1);

        if (permission.length > 0) {
          const permissionId = permission[0].id;

          // Check if role-permission relationship exists
          const existingRelation = await db
            .select()
            .from(table.rolePermissions)
            .where(
              eq(table.rolePermissions.roleId, roleId) &&
              eq(table.rolePermissions.permissionId, permissionId)
            )
            .limit(1);

          if (existingRelation.length === 0) {
            await db.insert(table.rolePermissions).values({
              id: crypto.randomUUID(),
              roleId,
              permissionId,
              createdAt: sql`now()`
            });
            logger.info(`Assigned permission '${permissionName}' to role '${role.name}'`, {}, { module: 'seed', function: 'seedInitialData' });
          }
        }
      }
    }

    logger.info('Database seeding completed successfully!', {}, { module: 'seed', function: 'seedInitialData' });
  } catch (error) {
    logger.error('Error during database seeding', { error: error instanceof Error ? error.message : String(error) }, { module: 'seed', function: 'seedInitialData' });
    throw error;
  }
}