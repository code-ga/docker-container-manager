import { Context } from "elysia";
import { hasPermission } from "../permissions";
import { auth } from "../libs/auth/auth";

/**
 * Creates a permission resolve function for use with Elysia's .resolve() method
 * @param permission - The permission string to check (e.g., 'container:own:*')
 * @returns Elysia resolve function that checks permission and returns context
 */
export function createPermissionResolve(permission: string) {
  return async (context: Context) => {
    try {
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

      return {
        user: session.user,
        session: session.session,
        hasPermission: true
      };
    } catch (error) {
      console.error('Error in permission resolve:', error);
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
 * Creates a resolve function that checks multiple permissions (user must have ALL)
 * @param permissions - Array of permission strings
 * @returns Elysia resolve function that checks all permissions
 */
export function createMultiPermissionResolve(permissions: string[]) {
  return async (context: Context) => {
    try {
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
      for (const permission of permissions) {
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
      }

      return {
        user: session.user,
        session: session.session,
        hasAllPermissions: true
      };
    } catch (error) {
      console.error('Error in multi permission resolve:', error);
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
 * Creates a resolve function that checks multiple permissions (user must have ANY)
 * @param permissions - Array of permission strings
 * @returns Elysia resolve function that checks if user has at least one permission
 */
export function createAnyPermissionResolve(permissions: string[]) {
  return async (context: Context) => {
    try {
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
      let hasAnyPerm = false;
      for (const permission of permissions) {
        const hasPerm = await hasPermission(userId, permission);
        if (hasPerm) {
          hasAnyPerm = true;
          break;
        }
      }

      if (!hasAnyPerm) {
        context.set.status = 403;
        return {
          status: 403,
          type: "error",
          success: false,
          message: `Forbidden: Missing any of the required permissions: ${permissions.join(', ')}`
        };
      }

      return {
        user: session.user,
        session: session.session,
        hasAnyPermission: true
      };
    } catch (error) {
      console.error('Error in any permission resolve:', error);
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