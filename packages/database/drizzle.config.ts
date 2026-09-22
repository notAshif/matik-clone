import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
if (!process.env.DATABASE_URL) {
  dotenv.config({ path: path.resolve(currentDir, "./.env") });
}
if (!process.env.DATABASE_URL) {
  dotenv.config({ path: path.resolve(currentDir, "../../.env") });
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schemas/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url:
      process.env.DATABASE_URL ||
      "postgresql://matik-postgres:postgres@111@localhost:5432/matik?schema=public",
  },
});
