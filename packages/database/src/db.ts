import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as schema from "./schemas/schema.ts";

const currentDir = path.dirname(fileURLToPath(import.meta.url));

if (!process.env.DATABASE_URL) {
  dotenv.config({ path: path.resolve(currentDir, "../.env") });
}
if (!process.env.DATABASE_URL) {
  dotenv.config({ path: path.resolve(currentDir, "../../../.env") });
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle({ client: pool, schema });
export { schema };