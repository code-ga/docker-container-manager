import { db } from '../database';
import { user, roles, permissions, rolePermissions, userRoles } from '../database/schema';
import { sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';

// Test data setup and utilities
export const testUsers = [
  {
    id: randomUUID(),
    name: 'Admin User',
    email: 'admin@test.com',
    emailVerified: true,
    roleIds: [],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: randomUUID(),
    name: 'Regular User',
    email: 'user@test.com',
    emailVerified: true,
    roleIds: [],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: randomUUID(),
    name: 'Manager User',
    email: 'manager@test.com',
    emailVerified: true,
    roleIds: [],
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export const testRoles = [
  {
    id: randomUUID(),
    name: 'Administrator',
    description: 'System administrator with full access',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: randomUUID(),
    name: 'User',
    description: 'Regular user with basic permissions',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: randomUUID(),
    name: 'Manager',
    description: 'Manager with elevated permissions',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export const testPermissions = [
  // User permissions
  { id: randomUUID(), name: 'user:*', description: 'All user permissions', createdAt: new Date(), updatedAt: new Date() },
  { id: randomUUID(), name: 'user:read', description: 'Read users', createdAt: new Date(), updatedAt: new Date() },
  { id: randomUUID(), name: 'user:write', description: 'Create users', createdAt: new Date(), updatedAt: new Date() },
  { id: randomUUID(), name: 'user:update', description: 'Update users', createdAt: new Date(), updatedAt: new Date() },
  { id: randomUUID(), name: 'user:delete', description: 'Delete users', createdAt: new Date(), updatedAt: new Date() },
  { id: randomUUID(), name: 'user:role:assign', description: 'Assign roles to users', createdAt: new Date(), updatedAt: new Date() },
  
  // Role permissions
  { id: randomUUID(), name: 'role:*', description: 'All role permissions', createdAt: new Date(), updatedAt: new Date() },
  { id: randomUUID(), name: 'role:read', description: 'Read roles', createdAt: new Date(), updatedAt: new Date() },
  { id: randomUUID(), name: 'role:write', description: 'Create roles', createdAt: new Date(), updatedAt: new Date() },
  { id: randomUUID(), name: 'role:update', description: 'Update roles', createdAt: new Date(), updatedAt: new Date() },
  { id: randomUUID(), name: 'role:delete', description: 'Delete roles', createdAt: new Date(), updatedAt: new Date() },
  
  // Container permissions
  { id: randomUUID(), name: 'container:*', description: 'All container permissions', createdAt: new Date(), updatedAt: new Date() },
  { id: randomUUID(), name: 'container:read', description: 'Read containers', createdAt: new Date(), updatedAt: new Date() },
  { id: randomUUID(), name: 'container:write', description: 'Create containers', createdAt: new Date(), updatedAt: new Date() },
  { id: randomUUID(), name: 'container:delete', description: 'Delete containers', createdAt: new Date(), updatedAt: new Date() },
  { id: randomUUID(), name: 'container:manage', description: 'Manage all containers', createdAt: new Date(), updatedAt: new Date() },
  { id: randomUUID(), name: 'container:own:*', description: 'All own container permissions', createdAt: new Date(), updatedAt: new Date() },
  { id: randomUUID(), name: 'container:own:start', description: 'Start own containers', createdAt: new Date(), updatedAt: new Date() },
  { id: randomUUID(), name: 'container:own:stop', description: 'Stop own containers', createdAt: new Date(), updatedAt: new Date() },
  { id: randomUUID(), name: 'container:own:restart', description: 'Restart own containers', createdAt: new Date(), updatedAt: new Date() },
  { id: randomUUID(), name: 'container:own:delete', description: 'Delete own containers', createdAt: new Date(), updatedAt: new Date() },
  { id: randomUUID(), name: 'container:own:logs', description: 'View own container logs', createdAt: new Date(), updatedAt: new Date() },
  
  // Log permissions
  { id: randomUUID(), name: 'logs:*', description: 'All log permissions', createdAt: new Date(), updatedAt: new Date() },
  { id: randomUUID(), name: 'logs:read', description: 'Read logs', createdAt: new Date(), updatedAt: new Date() },
  
  // Node permissions
  { id: randomUUID(), name: 'node:*', description: 'All node permissions', createdAt: new Date(), updatedAt: new Date() },
  { id: randomUUID(), name: 'node:read', description: 'Read nodes', createdAt: new Date(), updatedAt: new Date() },
  { id: randomUUID(), name: 'node:manage', description: 'Manage nodes', createdAt: new Date(), updatedAt: new Date() },
  
  // Cluster permissions
  { id: randomUUID(), name: 'cluster:*', description: 'All cluster permissions', createdAt: new Date(), updatedAt: new Date() },
  { id: randomUUID(), name: 'cluster:read', description: 'Read clusters', createdAt: new Date(), updatedAt: new Date() },
  { id: randomUUID(), name: 'cluster:manage', description: 'Manage clusters', createdAt: new Date(), updatedAt: new Date() },
  
  // Egg permissions
  { id: randomUUID(), name: 'egg:*', description: 'All egg permissions', createdAt: new Date(), updatedAt: new Date() },
  { id: randomUUID(), name: 'egg:read', description: 'Read eggs', createdAt: new Date(), updatedAt: new Date() },
  { id: randomUUID(), name: 'egg:manage', description: 'Manage eggs', createdAt: new Date(), updatedAt: new Date() },
  
  // Migration permissions
  { id: randomUUID(), name: 'migration:*', description: 'All migration permissions', createdAt: new Date(), updatedAt: new Date() },
  { id: randomUUID(), name: 'migration:manage', description: 'Manage migrations', createdAt: new Date(), updatedAt: new Date() }
];

// Role-permission mappings
export const rolePermissionMappings = [
  // Administrator role gets all permissions
  { id: randomUUID(), roleId: testRoles[0].id, permissionId: testPermissions[0].id }, // user:*
  { id: randomUUID(), roleId: testRoles[0].id, permissionId: testPermissions[1].id }, // user:read
  { id: randomUUID(), roleId: testRoles[0].id, permissionId: testPermissions[2].id }, // user:write
  { id: randomUUID(), roleId: testRoles[0].id, permissionId: testPermissions[3].id }, // user:update
  { id: randomUUID(), roleId: testRoles[0].id, permissionId: testPermissions[4].id }, // user:delete
  { id: randomUUID(), roleId: testRoles[0].id, permissionId: testPermissions[5].id }, // user:role:assign
  { id: randomUUID(), roleId: testRoles[0].id, permissionId: testPermissions[6].id }, // role:*
  { id: randomUUID(), roleId: testRoles[0].id, permissionId: testPermissions[7].id }, // role:read
  { id: randomUUID(), roleId: testRoles[0].id, permissionId: testPermissions[8].id }, // role:write
  { id: randomUUID(), roleId: testRoles[0].id, permissionId: testPermissions[9].id }, // role:update
  { id: randomUUID(), roleId: testRoles[0].id, permissionId: testPermissions[10].id }, // role:delete
  { id: randomUUID(), roleId: testRoles[0].id, permissionId: testPermissions[11].id }, // container:*
  { id: randomUUID(), roleId: testRoles[0].id, permissionId: testPermissions[12].id }, // container:read
  { id: randomUUID(), roleId: testRoles[0].id, permissionId: testPermissions[13].id }, // container:write
  { id: randomUUID(), roleId: testRoles[0].id, permissionId: testPermissions[14].id }, // container:delete
  { id: randomUUID(), roleId: testRoles[0].id, permissionId: testPermissions[15].id }, // container:manage
  { id: randomUUID(), roleId: testRoles[0].id, permissionId: testPermissions[16].id }, // container:own:*
  { id: randomUUID(), roleId: testRoles[0].id, permissionId: testPermissions[17].id }, // container:own:start
  { id: randomUUID(), roleId: testRoles[0].id, permissionId: testPermissions[18].id }, // container:own:stop
  { id: randomUUID(), roleId: testRoles[0].id, permissionId: testPermissions[19].id }, // container:own:restart
  { id: randomUUID(), roleId: testRoles[0].id, permissionId: testPermissions[20].id }, // container:own:delete
  { id: randomUUID(), roleId: testRoles[0].id, permissionId: testPermissions[21].id }, // container:own:logs
  { id: randomUUID(), roleId: testRoles[0].id, permissionId: testPermissions[22].id }, // logs:*
  { id: randomUUID(), roleId: testRoles[0].id, permissionId: testPermissions[23].id }, // logs:read
  { id: randomUUID(), roleId: testRoles[0].id, permissionId: testPermissions[24].id }, // node:*
  { id: randomUUID(), roleId: testRoles[0].id, permissionId: testPermissions[25].id }, // node:read
  { id: randomUUID(), roleId: testRoles[0].id, permissionId: testPermissions[26].id }, // node:manage
  { id: randomUUID(), roleId: testRoles[0].id, permissionId: testPermissions[27].id }, // cluster:*
  { id: randomUUID(), roleId: testRoles[0].id, permissionId: testPermissions[28].id }, // cluster:read
  { id: randomUUID(), roleId: testRoles[0].id, permissionId: testPermissions[29].id }, // cluster:manage
  { id: randomUUID(), roleId: testRoles[0].id, permissionId: testPermissions[30].id }, // egg:*
  { id: randomUUID(), roleId: testRoles[0].id, permissionId: testPermissions[31].id }, // egg:read
  { id: randomUUID(), roleId: testRoles[0].id, permissionId: testPermissions[32].id }, // egg:manage
  { id: randomUUID(), roleId: testRoles[0].id, permissionId: testPermissions[33].id }, // migration:*
  { id: randomUUID(), roleId: testRoles[0].id, permissionId: testPermissions[34].id }, // migration:manage
  
  // Manager role gets most permissions but not all
  { id: randomUUID(), roleId: testRoles[2].id, permissionId: testPermissions[1].id }, // user:read
  { id: randomUUID(), roleId: testRoles[2].id, permissionId: testPermissions[3].id }, // user:update
  { id: randomUUID(), roleId: testRoles[2].id, permissionId: testPermissions[7].id }, // role:read
  { id: randomUUID(), roleId: testRoles[2].id, permissionId: testPermissions[9].id }, // role:update
  { id: randomUUID(), roleId: testRoles[2].id, permissionId: testPermissions[12].id }, // container:read
  { id: randomUUID(), roleId: testRoles[2].id, permissionId: testPermissions[13].id }, // container:write
  { id: randomUUID(), roleId: testRoles[2].id, permissionId: testPermissions[15].id }, // container:manage
  { id: randomUUID(), roleId: testRoles[2].id, permissionId: testPermissions[16].id }, // container:own:*
  { id: randomUUID(), roleId: testRoles[2].id, permissionId: testPermissions[17].id }, // container:own:start
  { id: randomUUID(), roleId: testRoles[2].id, permissionId: testPermissions[18].id }, // container:own:stop
  { id: randomUUID(), roleId: testRoles[2].id, permissionId: testPermissions[19].id }, // container:own:restart
  { id: randomUUID(), roleId: testRoles[2].id, permissionId: testPermissions[20].id }, // container:own:delete
  { id: randomUUID(), roleId: testRoles[2].id, permissionId: testPermissions[21].id }, // container:own:logs
  { id: randomUUID(), roleId: testRoles[2].id, permissionId: testPermissions[23].id }, // logs:read
  { id: randomUUID(), roleId: testRoles[2].id, permissionId: testPermissions[25].id }, // node:read
  { id: randomUUID(), roleId: testRoles[2].id, permissionId: testPermissions[28].id }, // cluster:read
  { id: randomUUID(), roleId: testRoles[2].id, permissionId: testPermissions[31].id }, // egg:read
  
  // Regular user role gets basic permissions
  { id: randomUUID(), roleId: testRoles[1].id, permissionId: testPermissions[1].id }, // user:read
  { id: randomUUID(), roleId: testRoles[1].id, permissionId: testPermissions[12].id }, // container:read
  { id: randomUUID(), roleId: testRoles[1].id, permissionId: testPermissions[16].id }, // container:own:*
  { id: randomUUID(), roleId: testRoles[1].id, permissionId: testPermissions[17].id }, // container:own:start
  { id: randomUUID(), roleId: testRoles[1].id, permissionId: testPermissions[18].id }, // container:own:stop
  { id: randomUUID(), roleId: testRoles[1].id, permissionId: testPermissions[19].id }, // container:own:restart
  { id: randomUUID(), roleId: testRoles[1].id, permissionId: testPermissions[20].id }, // container:own:delete
  { id: randomUUID(), roleId: testRoles[1].id, permissionId: testPermissions[21].id }, // container:own:logs
  { id: randomUUID(), roleId: testRoles[1].id, permissionId: testPermissions[23].id }, // logs:read
];

// Export setup functions
export const setupTestData = async () => {
  // Clear existing test data
  await db.delete(rolePermissions);
  await db.delete(userRoles);
  await db.delete(permissions);
  await db.delete(roles);
  await db.delete(user);

  // Insert test permissions
  await db.insert(permissions).values(testPermissions);

  // Insert test roles
  await db.insert(roles).values(testRoles);

  // Insert role-permission mappings
  await db.insert(rolePermissions).values(rolePermissionMappings);

  // Insert test users
  await db.insert(user).values(testUsers);

  // Assign roles to users
  await db.insert(userRoles).values([
    { id: randomUUID(), userId: testUsers[0].id, roleId: testRoles[0].id }, // Admin gets Administrator role
    { id: randomUUID(), userId: testUsers[1].id, roleId: testRoles[1].id }, // Regular User gets User role
    { id: randomUUID(), userId: testUsers[2].id, roleId: testRoles[2].id }, // Manager gets Manager role
  ]);

  return {
    users: testUsers,
    roles: testRoles,
    permissions: testPermissions,
    rolePermissionMappings
  };
};

export const cleanupTestData = async () => {
  // Clear test data in reverse order of dependencies
  await db.delete(rolePermissions);
  await db.delete(userRoles);
  await db.delete(permissions);
  await db.delete(roles);
  await db.delete(user);
};

export const getTestUser = (userType: 'admin' | 'regular' | 'manager') => {
  switch (userType) {
    case 'admin':
      return testUsers[0];
    case 'regular':
      return testUsers[1];
    case 'manager':
      return testUsers[2];
    default:
      throw new Error(`Unknown user type: ${userType}`);
  }
};

export const getTestRole = (roleName: 'Administrator' | 'User' | 'Manager') => {
  switch (roleName) {
    case 'Administrator':
      return testRoles[0];
    case 'User':
      return testRoles[1];
    case 'Manager':
      return testRoles[2];
    default:
      throw new Error(`Unknown role name: ${roleName}`);
  }
};

export const getTestPermission = (permissionName: string) => {
  const permission = testPermissions.find(p => p.name === permissionName);
  if (!permission) {
    throw new Error(`Unknown permission: ${permissionName}`);
  }
  return permission;
};