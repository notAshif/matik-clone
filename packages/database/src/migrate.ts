import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "./db.ts";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const migrationsFolder = path.resolve(currentDir, "../drizzle");

export async function runMigrations(): Promise<void> {
  console.log("⏳ Running database migrations...");
  console.log(`📁 Migrations directory: ${migrationsFolder}`);

  try {
    await migrate(db, { migrationsFolder });
    console.log("✅ Database migrations applied successfully!");
  } catch (error: any) {
    if (error?.code === "ECONNREFUSED") {
      console.error("\n❌ Could not connect to PostgreSQL database (ECONNREFUSED).");
      console.error("👉 If using Docker, ensure your PostgreSQL container is running:");
      console.error("   docker start matik-postgres\n");
    } else {
      console.error("\n❌ Migration failed with error:", error);
    }
    throw error;
  } finally {
    try {
      await pool.end();
    } catch {
      // ignore pool end errors on shutdown
    }
  }
}

// Execute directly when run as CLI
if (import.meta.main) {
  runMigrations()
    .then(() => {
      process.exit(0);
    })
    .catch(() => {
      process.exit(1);
    });
}
