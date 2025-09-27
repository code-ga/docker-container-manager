import Elysia, { Static, t } from "elysia";
import { baseResponseType, userType } from "../types";
import { table } from "../database/schema";
import { db } from "../database";
import { eq, desc, sql } from "drizzle-orm";
import { auth } from "../libs/auth/auth";
import { randomUUID } from "crypto";

export const userRouter = new Elysia({ prefix: "/user" })
  .get("/:id", async (ctx) => {
    const { id } = ctx.params;
    const user = await db.select().from(table.user).where(eq(table.user.id, id)).limit(1);
    if (!user.length) {
      return ctx.error(404, { status: 404, type: "error", success: false, message: "User not found" });
    }
    return {
      status: 200,
      message: "User fetched successfully",
      success: true,
      type: "success",
      data: {
        user: user[0] as Static<typeof userType>
      }
    }
  }, {
    params: t.Object({
      id: t.String()
    }),
    response: {
      200: baseResponseType(t.Object({ user: userType })),
      404: baseResponseType(t.Null()),
    },
    detail: {
      description: "Get a user by id",
      responses: {
        200: {
          description: "User fetched successfully with no relationship added",
        },
        404: {
          description: "User not found",
        },
      },
      tags: ["user", "get", "api"]
    }
  })
  // GET /api/v1/users - List all users (paginated)
  .get("/", async (ctx) => {
    const { page = 1, limit = 10 } = ctx.query;
    const offset = (page - 1) * limit;

    const users = await db
      .select()
      .from(table.user)
      .orderBy(desc(table.user.createdAt))
      .limit(limit)
      .offset(offset);

    const total = await db
      .select({ count: sql<number>`count(*)` })
      .from(table.user);

    return {
      status: 200,
      message: "Users fetched successfully",
      success: true,
      type: "success",
      data: {
        users: users as Static<typeof userType>[],
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
        users: t.Array(userType),
        pagination: t.Object({
          page: t.Number(),
          limit: t.Number(),
          total: t.Number(),
          pages: t.Number()
        })
      }))
    },
    detail: {
      description: "List all users with pagination",
      tags: ["user", "list", "api"]
    }
  })
  // POST /api/v1/users - Create user
  .post("/", async (ctx) => {
    const { email, password, name, roleId } = ctx.body;

    try {
      // Use Better-Auth to create user
      const newUser = await auth.api.signUpEmail({
        body: {
          email,
          password,
          name
        }
      });

      if (!newUser.user) {
        return ctx.error(400, {
          status: 400,
          type: "error",
          success: false,
          message: "Failed to create user"
        });
      }

      // If roleId is provided, assign role to user
      if (roleId) {
        await db.insert(table.userRoles).values({
          id: randomUUID(),
          userId: newUser.user.id,
          roleId
        });
      }

      // Fetch the created user with roles
      const userWithRoles = await db
        .select()
        .from(table.user)
        .where(eq(table.user.id, newUser.user.id))
        .limit(1);

      return {
        status: 201,
        message: "User created successfully",
        success: true,
        type: "success",
        data: {
          user: userWithRoles[0] as Static<typeof userType>
        }
      }
    } catch (error: any) {
      return ctx.error(400, {
        status: 400,
        type: "error",
        success: false,
        message: error.message || "Failed to create user"
      });
    }
  }, {
    body: t.Object({
      email: t.String({ format: "email" }),
      password: t.String({ minLength: 8 }),
      name: t.String({ minLength: 1 }),
      roleId: t.Optional(t.String())
    }),
    response: {
      201: baseResponseType(t.Object({ user: userType })),
      400: baseResponseType(t.Null())
    },
    detail: {
      description: "Create a new user",
      tags: ["user", "create", "api"]
    }
  })
  // PUT /api/v1/users/:id - Update user
  .put("/:id", async (ctx) => {
    const { id } = ctx.params;
    const { name, email, roleId } = ctx.body;

    try {
      // Check if user exists
      const existingUser = await db
        .select()
        .from(table.user)
        .where(eq(table.user.id, id))
        .limit(1);

      if (!existingUser.length) {
        return ctx.error(404, {
          status: 404,
          type: "error",
          success: false,
          message: "User not found"
        });
      }

      // Update user data
      const updateData: any = {
        updatedAt: sql`now()`
      };

      if (name) updateData.name = name;
      if (email) updateData.email = email;

      await db
        .update(table.user)
        .set(updateData)
        .where(eq(table.user.id, id));

      // Update role if provided
      if (roleId) {
        // Remove existing roles
        await db
          .delete(table.userRoles)
          .where(eq(table.userRoles.userId, id));

        // Add new role
        await db.insert(table.userRoles).values({
          id: randomUUID(),
          userId: id,
          roleId
        });
      }

      // Fetch updated user
      const updatedUser = await db
        .select()
        .from(table.user)
        .where(eq(table.user.id, id))
        .limit(1);

      return {
        status: 200,
        message: "User updated successfully",
        success: true,
        type: "success",
        data: {
          user: updatedUser[0] as Static<typeof userType>
        }
      }
    } catch (error: any) {
      return ctx.error(400, {
        status: 400,
        type: "error",
        success: false,
        message: error.message || "Failed to update user"
      });
    }
  }, {
    params: t.Object({
      id: t.String()
    }),
    body: t.Object({
      name: t.Optional(t.String({ minLength: 1 })),
      email: t.Optional(t.String({ format: "email" })),
      roleId: t.Optional(t.String())
    }),
    response: {
      200: baseResponseType(t.Object({ user: userType })),
      404: baseResponseType(t.Null()),
      400: baseResponseType(t.Null())
    },
    detail: {
      description: "Update a user",
      tags: ["user", "update", "api"]
    }
  })
  // DELETE /api/v1/users/:id - Delete user
  .delete("/:id", async (ctx) => {
    const { id } = ctx.params;

    try {
      // Check if user exists
      const existingUser = await db
        .select()
        .from(table.user)
        .where(eq(table.user.id, id))
        .limit(1);

      if (!existingUser.length) {
        return ctx.error(404, {
          status: 404,
          type: "error",
          success: false,
          message: "User not found"
        });
      }

      // Delete user (cascade will handle related records)
      await db.delete(table.user).where(eq(table.user.id, id));

      return {
        status: 200,
        message: "User deleted successfully",
        success: true,
        type: "success",
        data: null
      }
    } catch (error: any) {
      return ctx.error(400, {
        status: 400,
        type: "error",
        success: false,
        message: error.message || "Failed to delete user"
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
      description: "Delete a user",
      tags: ["user", "delete", "api"]
    }
  })
  // POST /api/v1/users/:id/roles - Assign role to user
  .post("/:id/roles", async (ctx) => {
    const { id } = ctx.params;
    const { roleId } = ctx.body;

    try {
      // Check if user exists
      const existingUser = await db
        .select()
        .from(table.user)
        .where(eq(table.user.id, id))
        .limit(1);

      if (!existingUser.length) {
        return ctx.error(404, {
          status: 404,
          type: "error",
          success: false,
          message: "User not found"
        });
      }

      // Check if role exists
      const existingRole = await db
        .select()
        .from(table.roles)
        .where(eq(table.roles.id, roleId))
        .limit(1);

      if (!existingRole.length) {
        return ctx.error(404, {
          status: 404,
          type: "error",
          success: false,
          message: "Role not found"
        });
      }

      // Check if user already has this role
      const existingUserRole = await db
        .select()
        .from(table.userRoles)
        .where(eq(table.userRoles.userId, id) && eq(table.userRoles.roleId, roleId))
        .limit(1);

      if (existingUserRole.length) {
        return ctx.error(400, {
          status: 400,
          type: "error",
          success: false,
          message: "User already has this role"
        });
      }

      // Assign role to user
      await db.insert(table.userRoles).values({
        id: randomUUID(),
        userId: id,
        roleId
      });

      return {
        status: 201,
        message: "Role assigned to user successfully",
        success: true,
        type: "success",
        data: null
      }
    } catch (error: any) {
      return ctx.error(400, {
        status: 400,
        type: "error",
        success: false,
        message: error.message || "Failed to assign role to user"
      });
    }
  }, {
    params: t.Object({
      id: t.String()
    }),
    body: t.Object({
      roleId: t.String()
    }),
    response: {
      201: baseResponseType(t.Null()),
      404: baseResponseType(t.Null()),
      400: baseResponseType(t.Null())
    },
    detail: {
      description: "Assign a role to a user",
      tags: ["user", "role", "assign", "api"]
    }
  });
