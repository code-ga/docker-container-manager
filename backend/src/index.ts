import cors from "@elysiajs/cors";
import swagger from "@elysiajs/swagger";
import { Elysia } from "elysia";
import apiRouter from "./routes";
import { OpenAPI } from "./libs/auth/openApi";
import { createSuperAdmin } from "./utils/createSuperAdmin";

const PORT = process.env.PORT || 3000;
await createSuperAdmin();
export const app = new Elysia()
  .get("/", () => "Hello Elysia")
  .use(cors())
  .use(swagger({
    version: "1.0.0",
    documentation: {
      info: {
        title: "API For The Forum",
        version: "1.0.0",
        description: "API For The Forum to help you create your own forum with in a few minutes",
      }, tags: [{
        name: "auth",
        description: "Authentication endpoints (using better auth for the authentication auth docs is here /api/auth/reference)",
      }],
      components: await OpenAPI.components,
      paths: await OpenAPI.getPaths()
    }
  }))
  .use(apiRouter)
  .listen(PORT);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);

export type App = typeof app
export * from "./types"