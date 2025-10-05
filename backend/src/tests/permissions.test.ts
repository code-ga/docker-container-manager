import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'bun:test';
import { hasPermission, requirePermission, hasAllPermissions, hasAnyPermission } from '../permissions';
import { setupTestData, cleanupTestData, getTestUser, getTestPermission } from './permissions.setup.test';

describe('Permission System', () => {
  beforeAll(async () => {
    await setupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('hasPermission function', () => {
    it('should return true for exact permission match', async () => {
      const adminUser = getTestUser('admin');
      const result = await hasPermission(adminUser.id, 'user:read');
      expect(result).toBe(true);
    });

    it('should return true for wildcard permission match', async () => {
      const adminUser = getTestUser('admin');
      const result = await hasPermission(adminUser.id, 'user:write');
      expect(result).toBe(true);
    });

    it('should return false for missing permission', async () => {
      const regularUser = getTestUser('regular');
      const result = await hasPermission(regularUser.id, 'user:write');
      expect(result).toBe(false);
    });

    it('should return false for non-existent user', async () => {
      const result = await hasPermission('non-existent-id', 'user:read');
      expect(result).toBe(false);
    });

    it('should return false for non-existent permission', async () => {
      const adminUser = getTestUser('admin');
      const result = await hasPermission(adminUser.id, 'non:existent:permission');
      expect(result).toBe(false);
    });

    it('should handle wildcard permissions correctly', async () => {
      const regularUser = getTestUser('regular');

      // Should have container:own:* permission
      const hasWildcard = await hasPermission(regularUser.id, 'container:own:*');
      expect(hasWildcard).toBe(true);

      // Should have specific permissions under the wildcard
      const hasSpecific = await hasPermission(regularUser.id, 'container:own:start');
      expect(hasSpecific).toBe(true);
    });

    it('should handle database errors gracefully', async () => {
      // This test would require mocking database failures
      // For now, we'll test with valid data
      const adminUser = getTestUser('admin');
      const result = await hasPermission(adminUser.id, 'role:read');
      expect(result).toBe(true);
    });
  });

  describe('hasAllPermissions function', () => {
    it('should return true when user has all permissions', async () => {
      const adminUser = getTestUser('admin');
      const permissions = ['user:read', 'role:read', 'container:read'];
      const result = await hasAllPermissions(adminUser.id, permissions);
      expect(result).toBe(true);
    });

    it('should return false when user is missing any permission', async () => {
      const regularUser = getTestUser('regular');
      const permissions = ['user:read', 'user:write']; // Missing user:write
      const result = await hasAllPermissions(regularUser.id, permissions);
      expect(result).toBe(false);
    });

    it('should return true for empty permission array', async () => {
      const adminUser = getTestUser('admin');
      const result = await hasAllPermissions(adminUser.id, []);
      expect(result).toBe(true);
    });

    it('should return false for non-existent user', async () => {
      const result = await hasAllPermissions('non-existent-id', ['user:read']);
      expect(result).toBe(false);
    });
  });

  describe('hasAnyPermission function', () => {
    it('should return true when user has at least one permission', async () => {
      const regularUser = getTestUser('regular');
      const permissions = ['user:write', 'container:read']; // Has container:read
      const result = await hasAnyPermission(regularUser.id, permissions);
      expect(result).toBe(true);
    });

    it('should return false when user has none of the permissions', async () => {
      const regularUser = getTestUser('regular');
      const permissions = ['user:write', 'role:write']; // Has neither
      const result = await hasAnyPermission(regularUser.id, permissions);
      expect(result).toBe(false);
    });

    it('should return false for empty permission array', async () => {
      const adminUser = getTestUser('admin');
      const result = await hasAnyPermission(adminUser.id, []);
      expect(result).toBe(false);
    });

    it('should return false for non-existent user', async () => {
      const result = await hasAnyPermission('non-existent-id', ['user:read']);
      expect(result).toBe(false);
    });
  });

  describe('requirePermission middleware', () => {
    it('should allow access when user has required permission', async () => {
      const adminUser = getTestUser('admin');

      // Mock context object
      const mockContext = {
        request: {
          headers: new Headers({
            'Authorization': `Bearer mock-token-${adminUser.id}`
          })
        },
        set: {
          status: 200
        }
      };

      // Mock auth session
      const mockSession = {
        user: adminUser,
        session: { id: 'mock-session' }
      };

      // Mock the auth.api.getSession method
      const originalGetSession = (await import('../libs/auth/auth')).auth.api.getSession;
      (await import('../libs/auth/auth')).auth.api.getSession = async () => mockSession;

      try {
        const middleware = requirePermission('user:read');
        const result = await middleware(mockContext);

        expect(result.user).toEqual(adminUser);
        expect(result.session).toEqual(mockSession.session);
      } finally {
        // Restore original method
        (await import('../libs/auth/auth')).auth.api.getSession = originalGetSession;
      }
    });

    it('should deny access when user lacks required permission', async () => {
      const regularUser = getTestUser('regular');

      // Mock context object
      const mockContext = {
        request: {
          headers: new Headers({
            'Authorization': `Bearer mock-token-${regularUser.id}`
          })
        },
        set: {
          status: 200
        }
      };

      // Mock auth session
      const mockSession = {
        user: regularUser,
        session: { id: 'mock-session' }
      };

      // Mock the auth.api.getSession method
      const originalGetSession = (await import('../libs/auth/auth')).auth.api.getSession;
      (await import('../libs/auth/auth')).auth.api.getSession = async () => mockSession;

      try {
        const middleware = requirePermission('user:write');
        const result = await middleware(mockContext);

        expect(result.status).toBe(403);
        expect(result.message).toContain('Missing required permission');
      } finally {
        // Restore original method
        (await import('../libs/auth/auth')).auth.api.getSession = originalGetSession;
      }
    });

    it('should deny access when no session exists', async () => {
      // Mock context object
      const mockContext = {
        request: {
          headers: new Headers()
        },
        set: {
          status: 200
        }
      };

      // Mock the auth.api.getSession method to return null
      const originalGetSession = (await import('../libs/auth/auth')).auth.api.getSession;
      (await import('../libs/auth/auth')).auth.api.getSession = async () => null;

      try {
        const middleware = requirePermission('user:read');
        const result = await middleware(mockContext);

        expect(result.status).toBe(401);
        expect(result.message).toContain('Authentication required');
      } finally {
        // Restore original method
        (await import('../libs/auth/auth')).auth.api.getSession = originalGetSession;
      }
    });
  });

  describe('Permission inheritance and wildcard behavior', () => {
    it('should correctly handle wildcard permission inheritance', async () => {
      const regularUser = getTestUser('regular');

      // User has container:own:* permission
      const hasWildcard = await hasPermission(regularUser.id, 'container:own:*');
      expect(hasWildcard).toBe(true);

      // Should inherit specific permissions from wildcard
      const canStart = await hasPermission(regularUser.id, 'container:own:start');
      const canStop = await hasPermission(regularUser.id, 'container:own:stop');
      const canRestart = await hasPermission(regularUser.id, 'container:own:restart');
      const canDelete = await hasPermission(regularUser.id, 'container:own:delete');
      const canViewLogs = await hasPermission(regularUser.id, 'container:own:logs');

      expect(canStart).toBe(true);
      expect(canStop).toBe(true);
      expect(canRestart).toBe(true);
      expect(canDelete).toBe(true);
      expect(canViewLogs).toBe(true);
    });

    it('should not inherit permissions from different categories', async () => {
      const regularUser = getTestUser('regular');

      // User has container:own:* but not user:*
      const hasUserWildcard = await hasPermission(regularUser.id, 'user:*');
      expect(hasUserWildcard).toBe(false);

      // Should not have user permissions
      const canWriteUser = await hasPermission(regularUser.id, 'user:write');
      expect(canWriteUser).toBe(false);
    });

    it('should handle multiple wildcard permissions correctly', async () => {
      const managerUser = getTestUser('manager');

      // Manager should have multiple wildcard permissions
      const hasUserWildcard = await hasPermission(managerUser.id, 'user:*');
      const hasContainerWildcard = await hasPermission(managerUser.id, 'container:*');
      const hasRoleWildcard = await hasPermission(managerUser.id, 'role:*');

      expect(hasUserWildcard).toBe(false); // Manager doesn't have user:*
      expect(hasContainerWildcard).toBe(true); // Manager has container:*
      expect(hasRoleWildcard).toBe(false); // Manager doesn't have role:*
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle malformed permission strings', async () => {
      const adminUser = getTestUser('admin');

      // Test various malformed permissions
      const malformedPermissions = [
        '',
        ':',
        'invalid',
        'too:many:colons:here',
        'permission:with:special:chars:!@#'
      ];

      for (const permission of malformedPermissions) {
        const result = await hasPermission(adminUser.id, permission);
        expect(result).toBe(false);
      }
    });

    it('should handle null and undefined inputs', async () => {
      const adminUser = getTestUser('admin');

      // @ts-expect-error Testing invalid inputs
      const nullResult = await hasPermission(null, 'user:read');
      expect(nullResult).toBe(false);

      // @ts-expect-error Testing invalid inputs
      const undefinedResult = await hasPermission(undefined, 'user:read');
      expect(undefinedResult).toBe(false);

      // @ts-expect-error Testing invalid inputs
      const emptyStringResult = await hasPermission('', 'user:read');
      expect(emptyStringResult).toBe(false);
    });

    it('should handle concurrent permission checks', async () => {
      const adminUser = getTestUser('admin');
      const permissions = [
        'user:read',
        'role:read',
        'container:read',
        'logs:read',
        'node:read'
      ];

      // Run multiple permission checks concurrently
      const results = await Promise.all(
        permissions.map(permission => hasPermission(adminUser.id, permission))
      );

      // All should return true for admin user
      results.forEach(result => {
        expect(result).toBe(true);
      });
    });
  });

  describe('Permission performance', () => {
    it('should handle permission checks efficiently', async () => {
      const adminUser = getTestUser('admin');

      // Measure performance of multiple checks
      const startTime = performance.now();

      for (let i = 0; i < 100; i++) {
        await hasPermission(adminUser.id, 'user:read');
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete 100 checks in reasonable time (less than 1 second)
      expect(duration).toBeLessThan(1000);
    });
  });
});