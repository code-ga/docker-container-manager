import { pgTable, text, timestamp, unique, boolean, foreignKey, varchar, json, uuid, integer } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const verification = pgTable("verification", {
	id: text().primaryKey().notNull(),
	identifier: text().notNull(),
	value: text().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
});

export const user = pgTable("user", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	email: text().notNull(),
	emailVerified: boolean("email_verified").notNull(),
	image: text(),
	postIds: text("post_ids").array().default([""]),
	roleIds: text("role_ids").array().default([""]),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
}, (table) => [
	unique("user_email_unique").on(table.email),
]);

export const account = pgTable("account", {
	id: text().primaryKey().notNull(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: text("user_id").notNull(),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at", { mode: 'string' }),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { mode: 'string' }),
	scope: text(),
	password: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "account_user_id_user_id_fk"
		}),
]);

export const eggs = pgTable("eggs", {
	id: text().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	image: varchar({ length: 500 }).notNull(),
	startupCommand: text("startup_command"),
	envVars: json("env_vars").default({}),
	config: json().default({}),
	description: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const nodes = pgTable("nodes", {
	id: text().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	fqdn: varchar({ length: 255 }).notNull(),
	clusterId: text("cluster_id").notNull(),
	status: varchar({ length: 50 }).default('offline').notNull(),
	token: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.clusterId],
			foreignColumns: [clusters.id],
			name: "nodes_cluster_id_clusters_id_fk"
		}).onDelete("cascade"),
	unique("nodes_fqdn_unique").on(table.fqdn),
	unique("nodes_token_unique").on(table.token),
]);

export const logs = pgTable("logs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	containerUuid: uuid("container_uuid").notNull(),
	nodeId: text("node_id"),
	timestamp: timestamp({ mode: 'string' }).defaultNow().notNull(),
	message: text().notNull(),
	level: varchar({ length: 20 }).default('info').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.containerUuid],
			foreignColumns: [containers.uuid],
			name: "logs_container_uuid_containers_uuid_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.nodeId],
			foreignColumns: [nodes.id],
			name: "logs_node_id_nodes_id_fk"
		}).onDelete("set null"),
]);

export const clusters = pgTable("clusters", {
	id: text().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const roles = pgTable("roles", {
	id: text().primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	description: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("roles_name_unique").on(table.name),
]);

export const rolePermissions = pgTable("role_permissions", {
	id: text().primaryKey().notNull(),
	roleId: text("role_id").notNull(),
	permissionId: text("permission_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.roleId],
			foreignColumns: [roles.id],
			name: "role_permissions_role_id_roles_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.permissionId],
			foreignColumns: [permissions.id],
			name: "role_permissions_permission_id_permissions_id_fk"
		}).onDelete("cascade"),
]);

export const permissions = pgTable("permissions", {
	id: text().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("permissions_name_unique").on(table.name),
]);

export const session = pgTable("session", {
	id: text().primaryKey().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	token: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "session_user_id_user_id_fk"
		}),
	unique("session_token_unique").on(table.token),
]);

export const userContainerAssignments = pgTable("user_container_assignments", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	containerId: text("container_id").notNull(),
	permission: varchar({ length: 50 }).default('read').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "user_container_assignments_user_id_user_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.containerId],
			foreignColumns: [containers.id],
			name: "user_container_assignments_container_id_containers_id_fk"
		}).onDelete("cascade"),
]);

export const userRoles = pgTable("user_roles", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	roleId: text("role_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "user_roles_user_id_user_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.roleId],
			foreignColumns: [roles.id],
			name: "user_roles_role_id_roles_id_fk"
		}).onDelete("cascade"),
]);

export const containers = pgTable("containers", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	eggId: text("egg_id").notNull(),
	nodeId: text("node_id").notNull(),
	name: varchar({ length: 255 }).notNull(),
	status: varchar({ length: 50 }).default('stopped').notNull(),
	uuid: uuid().notNull(),
	cpuLimit: integer("cpu_limit"),
	memoryLimit: integer("memory_limit"),
	diskLimit: integer("disk_limit"),
	ports: json().default({}),
	volumes: json().default([]),
	environment: json().default({}),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	type: varchar().default('standard'),
	migrationStatus: varchar("migration_status").default('idle'),
	preferredClusterId: text("preferred_cluster_id"),
	lastHeartbeat: timestamp("last_heartbeat", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "containers_user_id_user_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.eggId],
			foreignColumns: [eggs.id],
			name: "containers_egg_id_eggs_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.nodeId],
			foreignColumns: [nodes.id],
			name: "containers_node_id_nodes_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.preferredClusterId],
			foreignColumns: [clusters.id],
			name: "containers_preferred_cluster_id_clusters_id_fk"
		}),
	unique("containers_uuid_unique").on(table.uuid),
]);

export const containerMigrationHistory = pgTable("container_migration_history", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	containerId: text("container_id").notNull(),
	fromNodeId: text("from_node_id").notNull(),
	toNodeId: text("to_node_id").notNull(),
	status: varchar({ length: 20 }).notNull(),
	timestamp: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.containerId],
			foreignColumns: [containers.id],
			name: "container_migration_history_container_id_containers_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.fromNodeId],
			foreignColumns: [nodes.id],
			name: "container_migration_history_from_node_id_nodes_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.toNodeId],
			foreignColumns: [nodes.id],
			name: "container_migration_history_to_node_id_nodes_id_fk"
		}).onDelete("cascade"),
]);

export const nodeHealth = pgTable("node_health", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	nodeId: text("node_id").notNull(),
	status: varchar({ length: 20 }).default('healthy').notNull(),
	lastHeartbeat: timestamp("last_heartbeat", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.nodeId],
			foreignColumns: [nodes.id],
			name: "node_health_node_id_nodes_id_fk"
		}).onDelete("cascade"),
]);
