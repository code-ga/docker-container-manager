import Elysia, { Static, t } from "elysia";
import { baseResponseType, userType } from "../types";
import { table } from "../database/schema";
import { db } from "../database";
import { eq } from "drizzle-orm";

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
  });
