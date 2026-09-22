import { spawn, spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const databaseDir = path.resolve(rootDir, "packages/database");

const args = process.argv.slice(2);
const isMigrateOnly = args.includes("--migrate-only");
const isSkipMigrate = args.includes("--skip-migrate");
const isBackendOnly = args.includes("--backend");
const isWebsocketOnly = args.includes("--websocket");
const isFrontendOnly = args.includes("--frontend");

function printBanner() {
  console.log("\n================================================");
  console.log("       \x1b[36m🎮  MATIK DEVELOPMENT RUNNER  🎮\x1b[0m");
  console.log("================================================\n");
}

function tryStartDockerPostgres(): boolean {
  try {
    const inspectResult = spawnSync("docker", ["inspect", "matik-postgres", "--format", "{{.State.Running}}"], {
      encoding: "utf-8",
      stdio: "pipe",
    });

    if (inspectResult.status === 0) {
      const isRunning = inspectResult.stdout.trim() === "true";
      if (!isRunning) {
        console.log("📦 Detected stopped Docker container 'matik-postgres'. Starting container...");
        const startResult = spawnSync("docker", ["start", "matik-postgres"], {
          encoding: "utf-8",
          stdio: "inherit",
        });
        if (startResult.status === 0) {
          console.log("✅ Docker container 'matik-postgres' started successfully!\n");
          return true;
        }
      } else {
        return true;
      }
    }
  } catch {
    // Docker is either not installed or not in PATH; ignore
  }
  return false;
}

async function runDatabaseMigration(): Promise<boolean> {
  console.log("\x1b[33m[1/2] 🗄️ Checking database & running migrations...\x1b[0m");

  // Attempt auto-start if docker postgres container is stopped
  tryStartDockerPostgres();

  return new Promise((resolve) => {
    const migrateProcess = spawn("bun", ["./src/migrate.ts"], {
      cwd: databaseDir,
      stdio: "inherit",
      shell: process.platform === "win32",
      env: {
        ...process.env,
      },
    });

    migrateProcess.on("close", (code: number) => {
      if (code === 0) {
        console.log("\x1b[32m✨ Database is fully migrated and ready!\x1b[0m\n");
        resolve(true);
      } else {
        console.error(`\x1b[31m❌ Database migration exited with code ${code}.\x1b[0m`);
        console.error("👉 If PostgreSQL is not running, run: docker start matik-postgres\n");
        resolve(false);
      }
    });

    migrateProcess.on("error", (err) => {
      console.error("\x1b[31m❌ Failed to execute migration script:\x1b[0m", err.message);
      resolve(false);
    });
  });
}

function startDevServers() {
  console.log("\x1b[35m[2/2] 🚀 Starting development servers...\x1b[0m");

  let turboArgs = ["run", "dev"];

  if (isBackendOnly) {
    turboArgs.push("--filter=@repo/backend");
    console.log("🎯 Filter: @repo/backend (API server on port 8000)");
  } else if (isWebsocketOnly) {
    turboArgs.push("--filter=@repo/websocket");
    console.log("🎯 Filter: @repo/websocket (WebSocket server on port 4000)");
  } else if (isFrontendOnly) {
    turboArgs.push("--filter=@repo/frontend");
    console.log("🎯 Filter: @repo/frontend (Vite client on port 5173)");
  } else {
    console.log("🌐 Running all workspaces: backend (8000), websocket (4000), frontend (5173)");
  }

  const devProcess = spawn("bun", ["x", "turbo", ...turboArgs], {
    cwd: rootDir,
    stdio: "inherit",
    shell: process.platform === "win32",
    env: {
      ...process.env,
    },
  });

  const cleanup = () => {
    if (!devProcess.killed) {
      devProcess.kill();
    }
    process.exit(0);
  };

  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);

  devProcess.on("close", (code: any) => {
    process.exit(code ?? 0);
  });
}

async function main() {
  printBanner();

  if (!isSkipMigrate) {
    const migrationSuccess = await runDatabaseMigration();
    if (!migrationSuccess) {
      if (isMigrateOnly) {
        process.exit(1);
      }
      console.error("\x1b[31m⛔ Dev server aborted because database migration failed.\x1b[0m");
      console.error("   To bypass migrations, run: bun dev --skip-migrate\n");
      process.exit(1);
    }
  }

  if (isMigrateOnly) {
    console.log("🏁 Migration completed. Exiting as requested by --migrate-only.");
    process.exit(0);
  }

  startDevServers();
}

main().catch((err) => {
  console.error("Unexpected error in dev runner:", err);
  process.exit(1);
});
