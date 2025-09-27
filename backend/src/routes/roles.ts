import Elysia, { t } from "elysia";
import { baseResponseType } from "../types";
import { table } from "../database/schema";
import { db } from "../database";
import { eq, desc, sql, and } from "drizzle-orm";
import { randomUUID } from "crypto";

export const rolesRouter = new Elysia({ prefix: "/roles" })
  // GET /api/v1/roles - List all roles (paginated)
  .get("/", async (ctx) => {
    const { page = 1, limit = 10 } = ctx.query;
    const offset = (page - 1) * limit;

    const roles = await db
      .select()
      .from(table.roles)
      .orderBy(desc(table.roles.createdAt))
      .limit(limit)
      .offset(offset);

    const total = await db
      .select({ count: sql<number>`count(*)` })
      .from(table.roles);

    return {
      status: 200,
      message: "Roles fetched successfully",
      success: true,
      type: "success",
      data: {
        roles: roles.map(role => ({
          ...role,
          description: role.description ?? undefined,
          createdAt: role.createdAt.toISOString(),
          updatedAt: role.updatedAt.toISOString()
        })),
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: total[0].count,
          pages: Math.ceil(total[0].count / limit)
        }
      }
    }
  }, {
    query: t.Object({
      page: t.Optional(t.Number({ minimum: 1 })),
      limit: t.Optional(t.Number({ minimum: 1, maximum: 100 }))
    }),
    response: {
      200: baseResponseType(t.Object({
        roles: t.Array(t.Object({
          id: t.String(),
          name: t.String(),
          description: t.Optional(t.String()),
          createdAt: t.String(),
          updatedAt: t.String()
        })),
        pagination: t.Object({
          page: t.Number(),
          limit: t.Number(),
          total: t.Number(),
          pages: t.Number()
        })
      }))
    },
    detail: {
      description: "List all roles with pagination",
      tags: ["role", "list", "api"]
    }
  })
  // POST /api/v1/roles - Create role
  .post("/", async (ctx) => {
    const { name, description } = ctx.body;

    try {
      // Check if role with same name already exists
      const existingRole = await db
        .select()
        .from(table.roles)
        .where(eq(table.roles.name, name))
        .limit(1);

      if (existingRole.length) {
        return ctx.error(400, {
          status: 400,
          type: "error",
          success: false,
          message: "Role with this name already exists"
        });
      }

      // Create new role
      const newRole = await db
        .insert(table.roles)
        .values({
          id: randomUUID(),
          name,
          description,
          createdAt: sql`now()`,
          updatedAt: sql`now()`
        })
        .returning();

      return {
        status: 201,
        message: "Role created successfully",
        success: true,
        type: "success",
        data: {
          role: {
            ...newRole[0],
            description: newRole[0].description ?? undefined
          }
        }
      }
    } catch (error: any) {
      return ctx.error(400, {
        status: 400,
        type: "error",
        success: false,
        message: error.message || "Failed to create role"
      });
    }
  }, {
    body: t.Object({
      name: t.String({ minLength: 1, maxLength: 100 }),
      description: t.Optional(t.String())
    }),
    response: {
      201: baseResponseType(t.Object({
        role: t.Object({
          id: t.String(),
          name: t.String(),
          description: t.Optional(t.String()),
          createdAt: t.String(),
          updatedAt: t.String()
        })
      })),
      400: baseResponseType(t.Null())
    },
    detail: {
      description: "Create a new role",
      tags: ["role", "create", "api"]
    }
  })
  // PUT /api/v1/roles/:id - Update role
  .put("/:id", async (ctx) => {
    const { id } = ctx.params;
    const { name, description } = ctx.body;

    try {
      // Check if role exists
      const existingRole = await db
        .select()
        .from(table.roles)
        .where(eq(table.roles.id, id))
        .limit(1);

      if (!existingRole.length) {
        return ctx.error(404, {
          status: 404,
          type: "error",
          success: false,
          message: "Role not found"
        });
      }

      // Check if another role with same name exists
      if (name) {
        const duplicateRole = await db
          .select()
          .from(table.roles)
          .where(and(eq(table.roles.name, name), sql`${table.roles.id} != ${id}`))
          .limit(1);

        if (duplicateRole.length) {
          return ctx.error(400, {
            status: 400,
            type: "error",
            success: false,
            message: "Another role with this name already exists"
          });
        }
      }

      // Update role data
      const updateData: any = {
        updatedAt: sql`now()`
      };

      if (name) updateData.name = name;
      if (description !== undefined) updateData.description = description;

      await db
        .update(table.roles)
        .set(updateData)
        .where(eq(table.roles.id, id));

      // Fetch updated role
      const updatedRole = await db
        .select()
        .from(table.roles)
        .where(eq(table.roles.id, id))
        .limit(1);

      return {
        status: 200,
        message: "Role updated successfully",
        success: true,
        type: "success",
        data: {
          role: {
            ...updatedRole[0],
            description: updatedRole[0].description ?? undefined,
            createdAt: updatedRole[0].createdAt.toISOString(),
            updatedAt: updatedRole[0].updatedAt.toISOString()
          }
        }
      }
    } catch (error: any) {
      return ctx.error(400, {
        status: 400,
        type: "error",
        success: false,
        message: error.message || "Failed to update role"
      });
    }
  }, {
    params: t.Object({
      id: t.String()
    }),
    body: t.Object({
      name: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
      description: t.Optional(t.String())
    }),
    response: {
      200: baseResponseType(t.Object({
        role: t.Object({
          id: t.String(),
          name: t.String(),
          description: t.Optional(t.String()),
          createdAt: t.String(),
          updatedAt: t.String()
        })
      })),
      404: baseResponseType(t.Null()),
      400: baseResponseType(t.Null())
    },
    detail: {
      description: "Update a role",
      tags: ["role", "update", "api"]
    }
  })
  // DELETE /api/v1/roles/:id - Delete role
  .delete("/:id", async (ctx) => {
    const { id } = ctx.params;

    try {
      // Check if role exists
      const existingRole = await db
        .select()
        .from(table.roles)
        .where(eq(table.roles.id, id))
        .limit(1);

      if (!existingRole.length) {
        return ctx.error(404, {
          status: 404,
          type: "error",
          success: false,
          message: "Role not found"
        });
      }

      // Check if role is assigned to any users
      const usersWithRole = await db
        .select()
        .from(table.userRoles)
        .where(eq(table.userRoles.roleId, id))
        .limit(1);

      if (usersWithRole.length) {
        return ctx.error(400, {
          status: 400,
          type: "error",
          success: false,
          message: "Cannot delete role that is assigned to users"
        });
      }

      // Delete role (cascade will handle role permissions)
      await db.delete(table.roles).where(eq(table.roles.id, id));

      return {
        status: 200,
        message: "Role deleted successfully",
        success: true,
        type: "success",
        data: null
      }
    } catch (error: any) {
      return ctx.error(400, {
        status: 400,
        type: "error",
        success: false,
        message: error.message || "Failed to delete role"
      });
    }
  }, {
    params: t.Object({
      id: t.String()
    }),
    response: {
      200: baseResponseType(t.Null()),
      404: baseResponseType(t.Null()),
      400: baseResponseType(t.Null())
    },
    detail: {
      description: "Delete a role",
      tags: ["role", "delete", "api"]
    }
  });