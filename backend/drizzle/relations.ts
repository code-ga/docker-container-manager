import { relations } from "drizzle-orm/relations";
import { user, account, clusters, nodes, containers, logs, roles, rolePermissions, permissions, session, userContainerAssignments, userRoles, eggs, containerMigrationHistory, nodeHealth } from "./schema";

export const accountRelations = relations(account, ({one}) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id]
	}),
}));

export const userRelations = relations(user, ({many}) => ({
	accounts: many(account),
	sessions: many(session),
	userContainerAssignments: many(userContainerAssignments),
	userRoles: many(userRoles),
	containers: many(containers),
}));

export const nodesRelations = relations(nodes, ({one, many}) => ({
	cluster: one(clusters, {
		fields: [nodes.clusterId],
		references: [clusters.id]
	}),
	logs: many(logs),
	containers: many(containers),
	containerMigrationHistories_fromNodeId: many(containerMigrationHistory, {
		relationName: "containerMigrationHistory_fromNodeId_nodes_id"
	}),
	containerMigrationHistories_toNodeId: many(containerMigrationHistory, {
		relationName: "containerMigrationHistory_toNodeId_nodes_id"
	}),
	nodeHealths: many(nodeHealth),
}));

export const clustersRelations = relations(clusters, ({many}) => ({
	nodes: many(nodes),
	containers: many(containers),
}));

export const logsRelations = relations(logs, ({one}) => ({
	container: one(containers, {
		fields: [logs.containerUuid],
		references: [containers.uuid]
	}),
	node: one(nodes, {
		fields: [logs.nodeId],
		references: [nodes.id]
	}),
}));

export const containersRelations = relations(containers, ({one, many}) => ({
	logs: many(logs),
	userContainerAssignments: many(userContainerAssignments),
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
	cluster: one(clusters, {
		fields: [containers.preferredClusterId],
		references: [clusters.id]
	}),
	containerMigrationHistories: many(containerMigrationHistory),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({one}) => ({
	role: one(roles, {
		fields: [rolePermissions.roleId],
		references: [roles.id]
	}),
	permission: one(permissions, {
		fields: [rolePermissions.permissionId],
		references: [permissions.id]
	}),
}));

export const rolesRelations = relations(roles, ({many}) => ({
	rolePermissions: many(rolePermissions),
	userRoles: many(userRoles),
}));

export const permissionsRelations = relations(permissions, ({many}) => ({
	rolePermissions: many(rolePermissions),
}));

export const sessionRelations = relations(session, ({one}) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	}),
}));

export const userContainerAssignmentsRelations = relations(userContainerAssignments, ({one}) => ({
	user: one(user, {
		fields: [userContainerAssignments.userId],
		references: [user.id]
	}),
	container: one(containers, {
		fields: [userContainerAssignments.containerId],
		references: [containers.id]
	}),
}));

export const userRolesRelations = relations(userRoles, ({one}) => ({
	user: one(user, {
		fields: [userRoles.userId],
		references: [user.id]
	}),
	role: one(roles, {
		fields: [userRoles.roleId],
		references: [roles.id]
	}),
}));

export const eggsRelations = relations(eggs, ({many}) => ({
	containers: many(containers),
}));

export const containerMigrationHistoryRelations = relations(containerMigrationHistory, ({one}) => ({
	container: one(containers, {
		fields: [containerMigrationHistory.containerId],
		references: [containers.id]
	}),
	node_fromNodeId: one(nodes, {
		fields: [containerMigrationHistory.fromNodeId],
		references: [nodes.id],
		relationName: "containerMigrationHistory_fromNodeId_nodes_id"
	}),
	node_toNodeId: one(nodes, {
		fields: [containerMigrationHistory.toNodeId],
		references: [nodes.id],
		relationName: "containerMigrationHistory_toNodeId_nodes_id"
	}),
}));

export const nodeHealthRelations = relations(nodeHealth, ({one}) => ({
	node: one(nodes, {
		fields: [nodeHealth.nodeId],
		references: [nodes.id]
	}),
}));