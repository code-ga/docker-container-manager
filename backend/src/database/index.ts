import { drizzle } from "drizzle-orm/node-postgres";
import { table } from "./schema";
export const db = drizzle({
  connection: {
    connectionString: process.env.DATABASE_URL!,
  },
  schema: table
});
