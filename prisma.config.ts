import { defineConfig } from "prisma/config";

// A prisma.config.ts file existing turns OFF Prisma's old auto-loading of
// .env — the CLI expects the config file to load it. Node's own loader
// (stable since ~v20) does exactly that, so no `dotenv` dependency is needed.
try {
  process.loadEnvFile();
} catch {
  // No .env file (e.g. CI with real env vars already set) — fine to skip.
}

// Replaces the deprecated `package.json#prisma` field (removed in Prisma 7).
// Still on the classic engine (schema.prisma's own `url`/`directUrl` datasource
// block) — this is just the seed-command move, not the driver-adapter jump
// Prisma 7 also requires. See docs/PROGRESS.md "Maintenance".
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
