/**
 * Read-only production schema check.
 *
 * The Vercel build runs `prisma generate` but never `db push` or
 * `migrate deploy`, so prod's schema only changes when someone remembers to
 * push it by hand. This reports what prod actually has versus what the repo
 * expects, without writing anything.
 *
 * Run: `npx tsx scripts/check-prod-drift.ts` (needs .env.production.local).
 */
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";

function loadProdEnv(): Record<string, string> {
  return Object.fromEntries(
    readFileSync(".env.production.local", "utf8")
      .split(/\r?\n/)
      .filter((l) => l.trim() && !l.trimStart().startsWith("#"))
      .map((l) => {
        const i = l.indexOf("=");
        return [
          l.slice(0, i).trim(),
          l.slice(i + 1).trim().replace(/^["']|["']$/g, ""),
        ];
      }),
  );
}

/** Models the repo dropped in Stage 8 — present in prod means prod is behind. */
const DROPPED = [
  "Tier",
  "Backing",
  "Perk",
  "PerkDelivery",
  "TrustReport",
  "FoundingMembership",
];

async function main() {
  const env = loadProdEnv();
  const url = env.DIRECT_URL || env.DATABASE_URL;
  if (!url) {
    console.log("  no DIRECT_URL/DATABASE_URL in .env.production.local");
    return;
  }
  console.log("  target:", url.replace(/:[^:@]+@/, ":****@").slice(0, 58) + "…");

  const p = new PrismaClient({ datasources: { db: { url } } });
  try {
    const rows = await p.$queryRawUnsafe<{ table_name: string }[]>(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema='public' ORDER BY table_name`,
    );
    const tables = rows.map((r) => r.table_name);
    console.log(`  prod has ${tables.length} tables`);

    const stale = DROPPED.filter((t) => tables.includes(t));
    console.log(
      "  dropped-in-repo tables still in prod:",
      stale.length ? stale.join(", ") : "none",
    );
    for (const t of stale) {
      const c = await p.$queryRawUnsafe<{ count: bigint }[]>(
        `SELECT COUNT(*)::bigint AS count FROM "${t}"`,
      );
      console.log(`    ${t}: ${c[0].count} rows`);
    }

    console.log("  RateLimit present (Stage 7):", tables.includes("RateLimit"));
    const col = await p.$queryRawUnsafe<{ column_name: string }[]>(
      `SELECT column_name FROM information_schema.columns
       WHERE table_name='Backer' AND column_name='pendingDeletionAt'`,
    );
    console.log("  Backer.pendingDeletionAt present (Stage 7):", col.length > 0);
    console.log(
      "  _prisma_migrations present:",
      tables.includes("_prisma_migrations"),
    );

    for (const t of ["Backer", "Streamer", "MochiHolding", "Order"]) {
      if (!tables.includes(t)) continue;
      const c = await p.$queryRawUnsafe<{ count: bigint }[]>(
        `SELECT COUNT(*)::bigint AS count FROM "${t}"`,
      );
      console.log(`  live data — ${t}: ${c[0].count} rows`);
    }
  } finally {
    await p.$disconnect();
  }
}

main().catch((e) => {
  console.log("  ERROR:", String(e.message).split("\n")[0]);
  process.exit(1);
});
