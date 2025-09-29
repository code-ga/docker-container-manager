import { eq, and } from 'drizzle-orm';
import { Context } from 'elysia';
import { db } from './database';
import { table } from './database/schema';
import { auth } from './libs/auth/auth';

/**
 * Check if a user has a specific permission
 * @param userId - The user's ID
 * @param permission - The permission string (e.g., 'container:own:start')
 * @returns Promise<boolean> - True if user has permission, false otherwise
 */
export async function hasPermission(userId: string, permission: string): Promise<boolean> {
  try {
    // First try exact match
    const exactResult = await db
      .select({
        permissionId: table.permissions.id
      })
      .from(table.userRoles)
      .innerJoin(table.roles, eq(table.userRoles.roleId, table.roles.id))
      .innerJoin(table.rolePermissions, eq(table.roles.id, table.rolePermissions.roleId))
      .innerJoin(table.permissions, eq(table.rolePermissions.permissionId, table.permissions.id))
      .where(
        and(
          eq(table.userRoles.userId, userId),
          eq(table.permissions.name, permission)
        )
      )
      .limit(1);

    if (exactResult.length > 0) {
      return true;
    }

    // If no exact match, check for wildcard permissions
    const wildcardResult = await db
      .select({
        permissionId: table.permissions.id
      })
      .from(table.userRoles)
      .innerJoin(table.roles, eq(table.userRoles.roleId, table.roles.id))
      .innerJoin(table.rolePermissions, eq(table.roles.id, table.rolePermissions.roleId))
      .innerJoin(table.permissions, eq(table.rolePermissions.permissionId, table.permissions.id))
      .where(
        and(
          eq(table.userRoles.userId, userId),
          eq(table.permissions.name, `${permission.split(':').slice(0, -1).join(':')}:*`)
        )
      )
      .limit(1);

    return wildcardResult.length > 0;
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
}

/**
 * Elysia middleware to require a specific permission
 * @param permission - The permission string to check
 * @returns Elysia middleware function
 */
export function requirePermission(permission: string) {
  return async (context: Context) => {
    try {
      // Get user from session using Better-Auth directly
      const session = await auth.api.getSession({ headers: context.request.headers });

      if (!session) {
        context.set.status = 401;
        return {
          status: 401,
          type: "error",
          success: false,
          message: "Unauthorized: Authentication required"
        };
      }

      const userId = session.user.id;
      const hasPerm = await hasPermission(userId, permission);

      if (!hasPerm) {
        context.set.status = 403;
        return {
          status: 403,
          type: "error",
          success: false,
          message: `Forbidden: Missing required permission '${permission}'`
        };
      }

      // Add user to context for downstream handlers
      return {
        user: session.user,
        session: session.session
      };
    } catch (error) {
      console.error('Error in requirePermission middleware:', error);
      context.set.status = 500;
      return {
        status: 500,
        type: "error",
        success: false,
        message: "Internal server error during permission check"
      };
    }
  };
}

/**
 * Helper function to check multiple permissions (user must have ALL)
 * @param userId - The user's ID
 * @param permissions - Array of permission strings
 * @returns Promise<boolean> - True if user has all permissions, false otherwise
 */
export async function hasAllPermissions(userId: string, permissions: string[]): Promise<boolean> {
  try {
    for (const permission of permissions) {
      if (!(await hasPermission(userId, permission))) {
        return false;
      }
    }
    return true;
  } catch (error) {
    console.error('Error checking multiple permissions:', error);
    return false;
  }
}

/**
 * Helper function to check multiple permissions (user must have ANY)
 * @param userId - The user's ID
 * @param permissions - Array of permission strings
 * @returns Promise<boolean> - True if user has at least one permission, false otherwise
 */
export async function hasAnyPermission(userId: string, permissions: string[]): Promise<boolean> {
  try {
    for (const permission of permissions) {
      if (await hasPermission(userId, permission)) {
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('Error checking any permission:', error);
    return false;
  }
}