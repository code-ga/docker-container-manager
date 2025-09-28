import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
  json,
  integer
} from 'drizzle-orm/pg-core';



export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull(),
  image: text('image'),
  postIds: text('post_ids').notNull().array().default([]),
  roleIds: text('role_ids').notNull().array().default([]),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull()
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id').notNull().references(() => user.id)
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id').notNull().references(() => user.id),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull()
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at')
});

// Enhanced roles table with proper structure
export const roles = pgTable("roles", {
  id: text("id").primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  description: text('description'),
  createdAt: timestamp('created_at').notNull().default(sql`now()`),
  updatedAt: timestamp('updated_at').notNull().default(sql`now()`)
});

// Permissions table
export const permissions = pgTable("permissions", {
  id: text("id").primaryKey(),
  name: varchar('name', { length: 255 }).notNull().unique(), // e.g., 'container:own:start'
  description: text('description'),
  createdAt: timestamp('created_at').notNull().default(sql`now()`),
  updatedAt: timestamp('updated_at').notNull().default(sql`now()`)
});

// Junction table for role permissions
export const rolePermissions = pgTable("role_permissions", {
  id: text("id").primaryKey(),
  roleId: text('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  permissionId: text('permission_id').notNull().references(() => permissions.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().default(sql`now()`)
});

// Junction table for user roles
export const userRoles = pgTable("user_roles", {
  id: text("id").primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  roleId: text('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().default(sql`now()`)
});

// Clusters table
export const clusters = pgTable("clusters", {
  id: text("id").primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').notNull().default(sql`now()`),
  updatedAt: timestamp('updated_at').notNull().default(sql`now()`)
});

// Nodes table
export const nodes = pgTable("nodes", {
  id: text("id").primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  fqdn: varchar('fqdn', { length: 255 }).notNull().unique(),
  clusterId: text('cluster_id').notNull().references(() => clusters.id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 50 }).notNull().default('offline'), // online, offline, maintenance
  token: text('token').notNull().unique(), // for authentication
  createdAt: timestamp('created_at').notNull().default(sql`now()`),
  updatedAt: timestamp('updated_at').notNull().default(sql`now()`)
});

// Eggs table
export const eggs = pgTable("eggs", {
  id: text("id").primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  image: varchar('image', { length: 500 }).notNull(), // Docker image
  startupCommand: text('startup_command'), // Startup command/script
  envVars: json('env_vars').$type<{[key: string]: string}>().default({}), // Environment variables as JSON
  config: json('config').$type<Record<string, any>>().default({}), // Configuration as JSON
  description: text('description'),
  createdAt: timestamp('created_at').notNull().default(sql`now()`),
  updatedAt: timestamp('updated_at').notNull().default(sql`now()`)
});

// Containers table
export const containers = pgTable("containers", {
  id: text("id").primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  eggId: text('egg_id').notNull().references(() => eggs.id, { onDelete: 'cascade' }),
  nodeId: text('node_id').notNull().references(() => nodes.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  status: varchar('status', { length: 50 }).notNull().default('stopped'), // running, stopped, starting, stopping, error
  uuid: uuid('uuid').notNull().unique(), // Unique identifier for the container
  cpuLimit: integer('cpu_limit'), // CPU limit in cores
  memoryLimit: integer('memory_limit'), // Memory limit in MB
  diskLimit: integer('disk_limit'), // Disk limit in MB
  ports: json('ports').$type<{[key: string]: number}>().default({}), // Port mappings as JSON
  volumes: json('volumes').$type<string[]>().default([]), // Volume mounts as JSON array
  environment: json('environment').$type<{[key: string]: string}>().default({}), // Environment variables
  type: varchar('type').$type<'standard' | 'ha'>().default('standard'), // Container type: standard or ha
  migration_status: varchar('migration_status').$type<'idle' | 'migrating' | 'failed'>().default('idle'), // Migration status for HA containers
  preferred_cluster_id: text('preferred_cluster_id').references(() => clusters.id), // Preferred cluster for HA containers
  last_heartbeat: timestamp('last_heartbeat'), // Last heartbeat timestamp for HA containers
  createdAt: timestamp('created_at').notNull().default(sql`now()`),
  updatedAt: timestamp('updated_at').notNull().default(sql`now()`)
});

// Node health table for HA monitoring
export const node_health = pgTable("node_health", {
  id: uuid('id').defaultRandom().primaryKey(),
  node_id: text('node_id').notNull().references(() => nodes.id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 20 }).$type<'healthy' | 'unhealthy'>().notNull().default('healthy'),
  last_heartbeat: timestamp('last_heartbeat').notNull(),
  createdAt: timestamp('created_at').notNull().default(sql`now()`),
  updatedAt: timestamp('updated_at').notNull().default(sql`now()`)
});

// Container migration history table
export const container_migration_history = pgTable("container_migration_history", {
  id: uuid('id').defaultRandom().primaryKey(),
  container_id: text('container_id').notNull().references(() => containers.id, { onDelete: 'cascade' }),
  from_node_id: text('from_node_id').notNull().references(() => nodes.id, { onDelete: 'cascade' }),
  to_node_id: text('to_node_id').notNull().references(() => nodes.id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 20 }).$type<'completed' | 'failed'>().notNull(),
  timestamp: timestamp('timestamp').notNull().default(sql`now()`)
});

// Logs table for container logs
export const logs = pgTable("logs", {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  containerUuid: uuid('container_uuid').notNull().references(() => containers.uuid, { onDelete: 'cascade' }),
  nodeId: text('node_id').references(() => nodes.id, { onDelete: 'set null' }),
  timestamp: timestamp('timestamp').notNull().default(sql`now()`),
  message: text('message').notNull(),
  level: varchar('level', { length: 20 }).notNull().default('info'), // info, error, warn, debug
  createdAt: timestamp('created_at').notNull().default(sql`now()`)
});

// User container assignments for sharing
export const userContainerAssignments = pgTable("user_container_assignments", {
  id: text("id").primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  containerId: text('container_id').notNull().references(() => containers.id, { onDelete: 'cascade' }),
  permission: varchar('permission', { length: 50 }).notNull().default('read'), // read, write, admin
  createdAt: timestamp('created_at').notNull().default(sql`now()`)
});

// Relations
export const userRelations = relations(user, ({ many }) => ({
  accounts: many(account),
  sessions: many(session),
  userRoles: many(userRoles),
  containers: many(containers),
  userContainerAssignments: many(userContainerAssignments)
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const verificationTokenRelations = relations(verification, ({ one }) => ({
  user: one(user, {
    fields: [verification.identifier],
    references: [user.id],
  }),
}));

export const roleRelations = relations(roles, ({ many }) => ({
  rolePermissions: many(rolePermissions),
  userRoles: many(userRoles)
}));

export const permissionRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions)
}));

export const rolePermissionRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, {
    fields: [rolePermissions.roleId],
    references: [roles.id]
  }),
  permission: one(permissions, {
    fields: [rolePermissions.permissionId],
    references: [permissions.id]
  })
}));

export const userRoleRelations = relations(userRoles, ({ one }) => ({
  user: one(user, {
    fields: [userRoles.userId],
    references: [user.id]
  }),
  role: one(roles, {
    fields: [userRoles.roleId],
    references: [roles.id]
  })
}));

export const clusterRelations = relations(clusters, ({ many }) => ({
  nodes: many(nodes)
}));

export const nodeRelations = relations(nodes, ({ one, many }) => ({
  cluster: one(clusters, {
    fields: [nodes.clusterId],
    references: [clusters.id]
  }),
  containers: many(containers)
}));

export const eggRelations = relations(eggs, ({ many }) => ({
  containers: many(containers)
}));

export const containerRelations = relations(containers, ({ one, many }) => ({
  user: one(user, {
    fields: [containers.userId],
    references: [user.id]
  }),
  egg: one(eggs, {
    fields: [containers.eggId],
    references: [eggs.id]
  }),
  node: one(nodes, {
    fields: [containers.nodeId],
    references: [nodes.id]
  }),
  userContainerAssignments: many(userContainerAssignments)
}));

export const userContainerAssignmentRelations = relations(userContainerAssignments, ({ one }) => ({
  user: one(user, {
    fields: [userContainerAssignments.userId],
    references: [user.id]
  }),
  container: one(containers, {
    fields: [userContainerAssignments.containerId],
    references: [containers.id]
  })
}));

// Logs relations
export const logsRelations = relations(logs, ({ one }) => ({
  container: one(containers, {
    fields: [logs.containerUuid],
    references: [containers.uuid]
  }),
  node: one(nodes, {
    fields: [logs.nodeId],
    references: [nodes.id]
  })
}));

export const containerLogsRelations = relations(containers, ({ many }) => ({
  logs: many(logs)
}));

export const nodeLogsRelations = relations(nodes, ({ many }) => ({
  logs: many(logs)
}));

export const nodeHealthRelations = relations(node_health, ({ one }) => ({
  node: one(nodes, {
    fields: [node_health.node_id],
    references: [nodes.id]
  })
}));

export const nodeHealthNodeRelations = relations(nodes, ({ many }) => ({
  health: many(node_health)
}));

// Migration history relations
export const containerMigrationHistoryRelations = relations(container_migration_history, ({ one }) => ({
  container: one(containers, {
    fields: [container_migration_history.container_id],
    references: [containers.id]
  }),
  fromNode: one(nodes, {
    fields: [container_migration_history.from_node_id],
    references: [nodes.id]
  }),
  toNode: one(nodes, {
    fields: [container_migration_history.to_node_id],
    references: [nodes.id]
  })
}));

export const containerMigrationHistoryContainerRelations = relations(containers, ({ many }) => ({
  migrationHistory: many(container_migration_history)
}));

export const containerMigrationHistoryFromNodeRelations = relations(nodes, ({ many }) => ({
  migrationHistoryFrom: many(container_migration_history, { relationName: 'fromNode' })
}));

export const containerMigrationHistoryToNodeRelations = relations(nodes, ({ many }) => ({
  migrationHistoryTo: many(container_migration_history, { relationName: 'toNode' })
}));

export const table = {
  user,
  account,
  session,
  verification,
  roles,
  permissions,
  rolePermissions,
  userRoles,
  clusters,
  nodes,
  eggs,
  containers,
  logs,
  userContainerAssignments,
  node_health,
  container_migration_history
} as const

export type Table = typeof table