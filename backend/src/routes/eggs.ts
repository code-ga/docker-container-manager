import Elysia, { Static, t } from "elysia";
import { baseResponseType } from "../types";
import { table } from "../database/schema";
import { db } from "../database";
import { eq, desc, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

const eggType = t.Object({
  id: t.String(),
  name: t.String(),
  image: t.String(),
  startupCommand: t.Optional(t.String()),
  envVars: t.Optional(t.Record(t.String(), t.String())),
  config: t.Optional(t.Record(t.String(), t.Any())),
  description: t.Optional(t.String()),
  createdAt: t.Date(),
  updatedAt: t.Date()
});

const createEggType = t.Object({
  name: t.String({ minLength: 1, maxLength: 255 }),
  image: t.String({ minLength: 1, maxLength: 500 }),
  startupCommand: t.Optional(t.String()),
  envVars: t.Optional(t.Record(t.String(), t.String())),
  config: t.Optional(t.Record(t.String(), t.Any())),
  description: t.Optional(t.String())
});

const updateEggType = t.Object({
  name: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
  image: t.Optional(t.String({ minLength: 1, maxLength: 500 })),
  startupCommand: t.Optional(t.String()),
  envVars: t.Optional(t.Record(t.String(), t.String())),
  config: t.Optional(t.Record(t.String(), t.Any())),
  description: t.Optional(t.String())
});

export const eggsRouter = new Elysia({ prefix: "/eggs" })
  // GET /api/v1/eggs - List all eggs (paginated)
  .get("/", async (ctx) => {
    const { page = 1, limit = 10 } = ctx.query;
    const offset = (page - 1) * limit;

    const eggs = await db
      .select()
      .from(table.eggs)
      .orderBy(desc(table.eggs.createdAt))
      .limit(limit)
      .offset(offset);

    const total = await db
      .select({ count: sql<number>`count(*)` })
      .from(table.eggs);

    return {
      status: 200,
      message: "Eggs fetched successfully",
      success: true,
      type: "success",
      data: {
        eggs: eggs as Static<typeof eggType>[],
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
        eggs: t.Array(eggType),
        pagination: t.Object({
          page: t.Number(),
          limit: t.Number(),
          total: t.Number(),
          pages: t.Number()
        })
      }))
    },
    detail: {
      description: "List all eggs with pagination",
      tags: ["egg", "list", "api"]
    }
  })

  // POST /api/v1/eggs - Create egg
  .post("/", async (ctx) => {
    const { name, image, startupCommand, envVars, config, description } = ctx.body;

    try {
      const newEgg = await db.insert(table.eggs).values({
        id: randomUUID(),
        name,
        image,
        startupCommand: startupCommand || null,
        envVars: envVars || {},
        config: config || {},
        description: description || null
      }).returning();

      return {
        status: 201,
        message: "Egg created successfully",
        success: true,
        type: "success",
        data: {
          egg: newEgg[0] as Static<typeof eggType>
        }
      }
    } catch (error: any) {
      return ctx.error(400, {
        status: 400,
        type: "error",
        success: false,
        message: error.message || "Failed to create egg"
      });
    }
  }, {
    body: createEggType,
    response: {
      201: baseResponseType(t.Object({ egg: eggType })),
      400: baseResponseType(t.Null())
    },
    detail: {
      description: "Create a new egg",
      tags: ["egg", "create", "api"]
    }
  })

  // PUT /api/v1/eggs/:id - Update egg
  .put("/:id", async (ctx) => {
    const { id } = ctx.params;
    const { name, image, startupCommand, envVars, config, description } = ctx.body;

    try {
      // Check if egg exists
      const existingEgg = await db
        .select()
        .from(table.eggs)
        .where(eq(table.eggs.id, id))
        .limit(1);

      if (!existingEgg.length) {
        return ctx.error(404, {
          status: 404,
          type: "error",
          success: false,
          message: "Egg not found"
        });
      }

      // Update egg data
      const updateData: any = {
        updatedAt: sql`now()`
      };

      if (name) updateData.name = name;
      if (image) updateData.image = image;
      if (startupCommand !== undefined) updateData.startupCommand = startupCommand;
      if (envVars !== undefined) updateData.envVars = envVars;
      if (config !== undefined) updateData.config = config;
      if (description !== undefined) updateData.description = description;

      await db
        .update(table.eggs)
        .set(updateData)
        .where(eq(table.eggs.id, id));

      // Fetch updated egg
      const updatedEgg = await db
        .select()
        .from(table.eggs)
        .where(eq(table.eggs.id, id))
        .limit(1);

      return {
        status: 200,
        message: "Egg updated successfully",
        success: true,
        type: "success",
        data: {
          egg: updatedEgg[0] as Static<typeof eggType>
        }
      }
    } catch (error: any) {
      return ctx.error(400, {
        status: 400,
        type: "error",
        success: false,
        message: error.message || "Failed to update egg"
      });
    }
  }, {
    params: t.Object({
      id: t.String()
    }),
    body: updateEggType,
    response: {
      200: baseResponseType(t.Object({ egg: eggType })),
      404: baseResponseType(t.Null()),
      400: baseResponseType(t.Null())
    },
    detail: {
      description: "Update an egg",
      tags: ["egg", "update", "api"]
    }
  })

  // DELETE /api/v1/eggs/:id - Delete egg
  .delete("/:id", async (ctx) => {
    const { id } = ctx.params;

    try {
      // Check if egg exists
      const existingEgg = await db
        .select()
        .from(table.eggs)
        .where(eq(table.eggs.id, id))
        .limit(1);

      if (!existingEgg.length) {
        return ctx.error(404, {
          status: 404,
          type: "error",
          success: false,
          message: "Egg not found"
        });
      }

      // Delete egg (cascade will handle related records)
      await db.delete(table.eggs).where(eq(table.eggs.id, id));

      return {
        status: 200,
        message: "Egg deleted successfully",
        success: true,
        type: "success",
        data: null
      }
    } catch (error: any) {
      return ctx.error(400, {
        status: 400,
        type: "error",
        success: false,
        message: error.message || "Failed to delete egg"
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
      description: "Delete an egg",
      tags: ["egg", "delete", "api"]
    }
  });