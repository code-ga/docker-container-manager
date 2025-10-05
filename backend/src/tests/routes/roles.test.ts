import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { rolesRouter } from '../../routes/roles';
import { setupTestData, cleanupTestData, getTestUser } from '../permissions.setup.test';
import { auth } from '../../libs/auth/auth';

// Test interfaces for type safety
interface RoleWithPermissions {
  id: string;
  name: string;
  description?: string;
  permissions: Array<{
    id: string;
    name: string;
    description?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

// Mock auth for testing
const mockAuth = {
  api: {
    getSession: async ({ headers }: { headers: Headers }) => {
      const authHeader = headers.get('Authorization');
      if (!authHeader) return null;

      const token = authHeader.replace('Bearer ', '');
      if (token.startsWith('mock-token-')) {
        const userId = token.replace('mock-token-', '');
        const testUser = [getTestUser('admin'), getTestUser('regular'), getTestUser('manager')]
          .find(u => u.id === userId);

        if (testUser) {
          return {
            user: testUser,
            session: {
              id: 'mock-session-id',
              token: token,
              userId: testUser.id,
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
              createdAt: new Date(),
              updatedAt: new Date()
            }
          };
        }
      }
      return null;
    }
  }
};

// Replace auth with mock
Object.assign(auth, mockAuth);

describe('Roles Router - Permission Tests', () => {
  beforeAll(async () => {
    await setupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('GET /roles - List roles', () => {
    it('should allow admin user to list roles', async () => {
      const adminUser = getTestUser('admin');

      const mockContext = {
        request: {
          headers: new Headers({
            'Authorization': `Bearer mock-token-${adminUser.id}`
          })
        },
        query: { page: 1, limit: 10 },
        set: { status: 200 }
      };

      // Test the route handler using Elysia's handle method
      const app = rolesRouter;

      const request = new Request('http://localhost/?page=1&limit=10', {
        method: 'GET',
        headers: mockContext.request.headers
      });

      const response = await app.fetch(request);

      const result = await response.json();

      expect(result.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.data.roles).toBeDefined();
    });

    it('should deny regular user from listing roles', async () => {
      const regularUser = getTestUser('regular');

      const mockContext = {
        request: {
          headers: new Headers({
            'Authorization': `Bearer mock-token-${regularUser.id}`
          })
        },
        query: { page: 1, limit: 10 },
        set: { status: 200 }
      };

      // Test the route handler using Elysia's handle method
      const app = rolesRouter;

      const request = new Request('http://localhost/?page=1&limit=10', {
        method: 'GET',
        headers: mockContext.request.headers
      });

      const response = await app.fetch(request);

      const result = await response.json();

      expect(result.status).toBe(403);
      expect(result.success).toBe(false);
      expect(result.message).toContain('Missing required permission');
    });

    it('should deny unauthenticated user from listing roles', async () => {
      const mockContext = {
        request: {
          headers: new Headers()
        },
        query: { page: 1, limit: 10 },
        set: { status: 200 }
      };

      // Test the route handler using Elysia's handle method
      const app = rolesRouter;

      const request = new Request('http://localhost/', {
        method: 'GET',
        headers: new Headers()
      });

      const response = await app.fetch(request);

      const result = await response.json();

      expect(result.status).toBe(401);
      expect(result.success).toBe(false);
      expect(result.message).toContain('Authentication required');
    });
  });

  describe('POST /roles - Create role', () => {
    it('should allow admin user to create role', async () => {
      const adminUser = getTestUser('admin');

      const mockContext = {
        request: {
          headers: new Headers({
            'Authorization': `Bearer mock-token-${adminUser.id}`
          })
        },
        body: {
          name: 'Test Role',
          description: 'A test role for testing'
        },
        set: { status: 200 }
      };

      // Test the route handler using Elysia app directly
      const app = rolesRouter;

      // Create a proper request object for Elysia
      const request = new Request('http://localhost/', {
        method: 'POST',
        headers: mockContext.request.headers,
        body: JSON.stringify(mockContext.body)
      });

      const response = await app.fetch(request);
      const result = await response.json();

      expect(result.status).toBe(201);
      expect(result.success).toBe(true);
      expect(result.data.role).toBeDefined();
      expect(result.data.role.name).toBe('Test Role');
    });

    it('should deny regular user from creating role', async () => {
      const regularUser = getTestUser('regular');

      const mockContext = {
        request: {
          headers: new Headers({
            'Authorization': `Bearer mock-token-${regularUser.id}`
          })
        },
        body: {
          name: 'Test Role',
          description: 'A test role for testing'
        },
        set: { status: 200 }
      };

      // Test the route handler using Elysia app directly
      const app = rolesRouter;

      const request = new Request('http://localhost/', {
        method: 'POST',
        headers: mockContext.request.headers,
        body: JSON.stringify(mockContext.body)
      });

      const response = await app.fetch(request);
      const result = await response.json();

      expect(result.status).toBe(403);
      expect(result.success).toBe(false);
      expect(result.message).toContain('Missing required permission');
    });

    it('should validate role creation input', async () => {
      const adminUser = getTestUser('admin');

      const mockContext = {
        request: {
          headers: new Headers({
            'Authorization': `Bearer mock-token-${adminUser.id}`
          })
        },
        body: {
          // Missing name field
          description: 'A test role for testing'
        },
        set: { status: 200 }
      };

      // Test the route handler using Elysia app directly
      const app = rolesRouter;

      const request = new Request('http://localhost/', {
        method: 'POST',
        headers: mockContext.request.headers,
        body: JSON.stringify(mockContext.body)
      });

      const response = await app.fetch(request);
      const result = await response.json();

      expect(result.status).toBe(400);
      expect(result.success).toBe(false);
    });

    it('should prevent duplicate role names', async () => {
      const adminUser = getTestUser('admin');

      const mockContext = {
        request: {
          headers: new Headers({
            'Authorization': `Bearer mock-token-${adminUser.id}`
          })
        },
        body: {
          name: 'Administrator', // This already exists
          description: 'Duplicate role name'
        },
        set: { status: 200 }
      };

      // Test the route handler using Elysia app directly
      const app = rolesRouter;

      const request = new Request('http://localhost/', {
        method: 'POST',
        headers: mockContext.request.headers,
        body: JSON.stringify(mockContext.body)
      });

      const response = await app.fetch(request);
      const result = await response.json();

      expect(result.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.message).toContain('already exists');
    });
  });

  describe('PUT /roles/:id - Update role', () => {
    it('should allow admin user to update role', async () => {
      const adminUser = getTestUser('admin');

      // First get an existing role ID
      const { db } = await import('../../database');
      const { roles } = await import('../../database/schema');

      const existingRole = await db.select().from(roles).limit(1);
      const roleId = existingRole[0]?.id;

      if (!roleId) {
        // Skip test if no role exists
        return;
      }

      const mockContext = {
        request: {
          headers: new Headers({
            'Authorization': `Bearer mock-token-${adminUser.id}`
          })
        },
        params: { id: roleId },
        body: {
          name: 'Updated Role Name',
          description: 'Updated description'
        },
        set: { status: 200 }
      };

      // Test the route handler using Elysia app directly
      const app = rolesRouter;

      const request = new Request(`http://localhost/${mockContext.params.id}`, {
        method: 'PUT',
        headers: mockContext.request.headers,
        body: JSON.stringify(mockContext.body)
      });

      const response = await app.fetch(request);
      const result = await response.json();

      expect(result.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.data.role).toBeDefined();
    });

    it('should deny regular user from updating role', async () => {
      const regularUser = getTestUser('regular');

      const mockContext = {
        request: {
          headers: new Headers({
            'Authorization': `Bearer mock-token-${regularUser.id}`
          })
        },
        params: { id: 'some-role-id' },
        body: {
          name: 'Updated Role Name',
          description: 'Updated description'
        },
        set: { status: 200 }
      };

      // Test the route handler using Elysia app directly
      const app = rolesRouter;

      const request = new Request(`http://localhost/${mockContext.params.id}`, {
        method: 'PUT',
        headers: mockContext.request.headers,
        body: JSON.stringify(mockContext.body)
      });

      const response = await app.fetch(request);
      const result = await response.json();

      expect(result.status).toBe(403);
      expect(result.success).toBe(false);
      expect(result.message).toContain('Missing required permission');
    });

    it('should return 404 for non-existent role', async () => {
      const adminUser = getTestUser('admin');

      const mockContext = {
        request: {
          headers: new Headers({
            'Authorization': `Bearer mock-token-${adminUser.id}`
          })
        },
        params: { id: 'non-existent-role-id' },
        body: {
          name: 'Updated Role Name',
          description: 'Updated description'
        },
        set: { status: 200 }
      };

      // Test the route handler using Elysia app directly
      const app = rolesRouter;

      const request = new Request(`http://localhost/${mockContext.params.id}`, {
        method: 'PUT',
        headers: mockContext.request.headers,
        body: JSON.stringify(mockContext.body)
      });

      const response = await app.fetch(request);
      const result = await response.json();

      expect(result.status).toBe(404);
      expect(result.success).toBe(false);
      expect(result.message).toContain('Role not found');
    });
  });

  describe('DELETE /roles/:id - Delete role', () => {
    it('should allow admin user to delete role', async () => {
      const adminUser = getTestUser('admin');

      // First create a role to delete
      const { db } = await import('../../database');
      const { roles } = await import('../../database/schema');

      const testRole = await db.insert(roles).values({
        id: 'test-delete-role-id',
        name: 'Role to Delete',
        description: 'This role will be deleted',
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();

      const roleId = testRole[0]?.id;

      if (!roleId) {
        // Skip test if role creation failed
        return;
      }

      const mockContext = {
        request: {
          headers: new Headers({
            'Authorization': `Bearer mock-token-${adminUser.id}`
          })
        },
        params: { id: roleId },
        set: { status: 200 }
      };

      // Test the route handler using Elysia app directly
      const app = rolesRouter;

      const request = new Request(`http://localhost/${mockContext.params.id}`, {
        method: 'DELETE',
        headers: mockContext.request.headers
      });

      const response = await app.fetch(request);
      const result = await response.json();

      expect(result.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });

    it('should deny regular user from deleting role', async () => {
      const regularUser = getTestUser('regular');

      const mockContext = {
        request: {
          headers: new Headers({
            'Authorization': `Bearer mock-token-${regularUser.id}`
          })
        },
        params: { id: 'some-role-id' },
        set: { status: 200 }
      };

      // Test the route handler using Elysia app directly
      const app = rolesRouter;

      const request = new Request(`http://localhost/${mockContext.params.id}`, {
        method: 'DELETE',
        headers: mockContext.request.headers
      });

      const response = await app.fetch(request);
      const result = await response.json();

      expect(result.status).toBe(403);
      expect(result.success).toBe(false);
      expect(result.message).toContain('Missing required permission');
    });

    it('should prevent deletion of role assigned to users', async () => {
      const adminUser = getTestUser('admin');

      // Create a role and assign it to a user
      const { db } = await import('../../database');
      const { roles, userRoles } = await import('../../database/schema');
      const { randomUUID } = await import('crypto');

      const testRole = await db.insert(roles).values({
        id: 'assigned-role-id',
        name: 'Assigned Role',
        description: 'This role is assigned to users',
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();

      const roleId = testRole[0]?.id;

      if (roleId) {
        // Assign role to a user
        await db.insert(userRoles).values({
          id: randomUUID(),
          userId: adminUser.id,
          roleId: roleId
        });
      }

      const mockContext = {
        request: {
          headers: new Headers({
            'Authorization': `Bearer mock-token-${adminUser.id}`
          })
        },
        params: { id: roleId },
        set: { status: 200 }
      };

      // Test the route handler using Elysia app directly
      const app = rolesRouter;

      const request = new Request(`http://localhost/${mockContext.params.id}`, {
        method: 'DELETE',
        headers: mockContext.request.headers
      });

      const response = await app.fetch(request);
      const result = await response.json();

      expect(result.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.message).toContain('assigned to users');
    });
  });

  describe('GET /roles/with-permissions - Get roles with permissions', () => {
    it('should allow admin user to get roles with permissions', async () => {
      const adminUser = getTestUser('admin');

      const mockContext = {
        request: {
          headers: new Headers({
            'Authorization': `Bearer mock-token-${adminUser.id}`
          })
        },
        set: { status: 200 }
      };

      // Test the route handler using Elysia app directly
      const app = rolesRouter;

      const request = new Request('http://localhost/with-permissions', {
        method: 'GET',
        headers: mockContext.request.headers
      });

      const response = await app.fetch(request);
      const result = await response.json();

      expect(result.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.data.roles).toBeDefined();
      expect(Array.isArray(result.data.roles)).toBe(true);

      // Check that roles have permissions array
      result.data.roles.forEach((role: RoleWithPermissions) => {
        expect(role.permissions).toBeDefined();
        expect(Array.isArray(role.permissions)).toBe(true);
      });
    });

    it('should deny regular user from getting roles with permissions', async () => {
      const regularUser = getTestUser('regular');

      const mockContext = {
        request: {
          headers: new Headers({
            'Authorization': `Bearer mock-token-${regularUser.id}`
          })
        },
        set: { status: 200 }
      };

      // Test the route handler using Elysia app directly
      const app = rolesRouter;

      const request = new Request('http://localhost/with-permissions', {
        method: 'GET',
        headers: mockContext.request.headers
      });

      const response = await app.fetch(request);
      const result = await response.json();

      expect(result.status).toBe(403);
      expect(result.success).toBe(false);
      expect(result.message).toContain('Missing required permission');
    });
  });

  describe('Permission validation edge cases', () => {
    it('should handle malformed role IDs', async () => {
      const adminUser = getTestUser('admin');

      const mockContext = {
        request: {
          headers: new Headers({
            'Authorization': `Bearer mock-token-${adminUser.id}`
          })
        },
        params: { id: '' }, // Empty ID
        body: {
          name: 'Updated Role Name',
          description: 'Updated description'
        },
        set: { status: 200 }
      };

      // Test the route handler using Elysia app directly
      const app = rolesRouter;

      const request = new Request(`http://localhost/${mockContext.params.id}`, {
        method: 'PUT',
        headers: mockContext.request.headers,
        body: JSON.stringify(mockContext.body)
      });

      const response = await app.fetch(request);
      const result = await response.json();

      expect(result.status).toBe(404);
      expect(result.success).toBe(false);
    });

    it('should handle extremely long role names', async () => {
      const adminUser = getTestUser('admin');

      const longName = 'a'.repeat(200); // Exceeds max length

      const mockContext = {
        request: {
          headers: new Headers({
            'Authorization': `Bearer mock-token-${adminUser.id}`
          })
        },
        body: {
          name: longName,
          description: 'A test role for testing'
        },
        set: { status: 200 }
      };

      // Test the route handler using Elysia app directly
      const app = rolesRouter;

      const request = new Request('http://localhost/', {
        method: 'POST',
        headers: mockContext.request.headers,
        body: JSON.stringify(mockContext.body)
      });

      const response = await app.fetch(request);
      const result = await response.json();

      expect(result.status).toBe(400);
      expect(result.success).toBe(false);
    });

    it('should handle special characters in role names', async () => {
      const adminUser = getTestUser('admin');

      const specialName = 'Test-Role_123!@#';

      const mockContext = {
        request: {
          headers: new Headers({
            'Authorization': `Bearer mock-token-${adminUser.id}`
          })
        },
        body: {
          name: specialName,
          description: 'A test role for testing'
        },
        set: { status: 200 }
      };

      // Test the route handler using Elysia app directly
      const app = rolesRouter;

      const request = new Request('http://localhost/', {
        method: 'POST',
        headers: mockContext.request.headers,
        body: JSON.stringify(mockContext.body)
      });

      const response = await app.fetch(request);
      const result = await response.json();

      expect(result.status).toBe(201);
      expect(result.success).toBe(true);
      expect(result.data.role.name).toBe(specialName);
    });
  });
});