/**
 * Remove the dev seed from a database.
 *
 * The seed was run against production at some point, so 63 of 70 accounts and
 * 10 of 12 creators on the live site are fake — and counted in every supporter
 * total, leaderboard and headline stat. `scripts/seed-audit.ts` reports the
 * damage; this undoes it.
 *
 *   pnpm seed:remove --prod            # dry run: says what it would delete
 *   pnpm seed:remove --prod --confirm  # actually deletes
 *
 * **Dry run is the default and the flag is `--confirm`, not `-y`.** This is
 * irreversible against a live database, and the shape of the command should
 * make that obvious to whoever is pasting it at 2am.
 *
 * It refuses to run if a *real* fan has a balance, order or donation with a
 * seeded creator, because the cascade would erase support somebody paid for.
 * `--force-orphan-check-off` does not exist on purpose: if that check fires,
 * the answer is a decision about that fan's money, not a bigger hammer.
 */
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";

const SEED_EMAIL_SUFFIX = "@motoo.dev";
const SEED_HANDLES = [
  "creatorA", "creatorB", "creatorC", "creatorD", "creatorE",
  "creatorF", "creatorG", "creatorH", "creatorI", "creatorJ",
];

function productionUrl(): string {
  const m = /^DIRECT_URL\s*=\s*"?([^"\n\r]+)"?/m.exec(
    readFileSync(".env.production.local", "utf8"),
  );
  if (!m) throw new Error("No DIRECT_URL in .env.production.local");
  return m[1].trim();
}

const useProd = process.argv.includes("--prod");
const confirmed = process.argv.includes("--confirm");
const allowOwnerHolding = process.argv.includes("--accept-owner-holding");

const prisma = useProd
  ? new PrismaClient({ datasourceUrl: productionUrl() })
  : new PrismaClient();

async function main() {
  console.log(`Target: ${useProd ? "PRODUCTION" : "local"}`);
  console.log(confirmed ? "Mode:   DELETE\n" : "Mode:   dry run\n");

  const seedBackers = await prisma.backer.findMany({
    where: { email: { endsWith: SEED_EMAIL_SUFFIX } },
    select: { id: true },
  });
  const seedStreamers = await prisma.streamer.findMany({
    where: { handle: { in: SEED_HANDLES } },
    select: { id: true },
  });
  const backerIds = seedBackers.map((b) => b.id);
  const streamerIds = seedStreamers.map((s) => s.id);

  if (backerIds.length === 0 && streamerIds.length === 0) {
    console.log("Nothing to remove.");
    return;
  }

  // The safety gate. A real fan's balance in a seeded creator would be
  // destroyed by the cascade, and a balance is something they paid for.
  const orphans = await prisma.mochiHolding.findMany({
    where: { streamerId: { in: streamerIds }, backerId: { notIn: backerIds } },
    select: {
      balance: true,
      krwPaidTotal: true,
      backer: { select: { email: true } },
      streamer: { select: { handle: true } },
    },
  });
  const realOrders = await prisma.order.count({
    where: { streamerId: { in: streamerIds }, backerId: { notIn: backerIds } },
  });
  const realDonations = await prisma.donation.count({
    where: { streamerId: { in: streamerIds }, backerId: { notIn: backerIds } },
  });

  if (orphans.length > 0 || realOrders > 0 || realDonations > 0) {
    console.log("Real records attached to seeded creators:");
    for (const o of orphans) {
      console.log(
        `  ${o.backer.email} → @${o.streamer.handle}: balance ${o.balance}, paid ${o.krwPaidTotal} KRW`,
      );
    }
    if (realOrders) console.log(`  ${realOrders} order(s)`);
    if (realDonations) console.log(`  ${realDonations} donation(s)`);

    if (!allowOwnerHolding) {
      console.log(
        "\nRefusing to delete. These are balances and history that a real account\n" +
          "paid for, and the cascade would erase them without a trace.\n" +
          "If they are your own test records and you accept losing them, re-run with\n" +
          "--accept-owner-holding.",
      );
      process.exitCode = 1;
      return;
    }
    console.log("\n--accept-owner-holding given: proceeding anyway.\n");
  }

  const counts = {
    holdings: await prisma.mochiHolding.count({
      where: { OR: [{ backerId: { in: backerIds } }, { streamerId: { in: streamerIds } }] },
    }),
    orders: await prisma.order.count({
      where: { OR: [{ backerId: { in: backerIds } }, { streamerId: { in: streamerIds } }] },
    }),
    donations: await prisma.donation.count({
      where: { OR: [{ backerId: { in: backerIds } }, { streamerId: { in: streamerIds } }] },
    }),
    items: await prisma.marketplaceItem.count({ where: { streamerId: { in: streamerIds } } }),
    updates: await prisma.update.count({ where: { streamerId: { in: streamerIds } } }),
    creators: streamerIds.length,
    accounts: backerIds.length,
  };

  console.log("Would delete:");
  for (const [k, v] of Object.entries(counts)) console.log(`  ${k.padEnd(10)} ${v}`);

  if (!confirmed) {
    console.log("\nDry run — nothing was changed. Re-run with --confirm to delete.");
    return;
  }

  // Order matters: children before parents, and creators before accounts,
  // because a seeded account owns a seeded creator.
  await prisma.$transaction([
    prisma.order.deleteMany({
      where: { OR: [{ backerId: { in: backerIds } }, { streamerId: { in: streamerIds } }] },
    }),
    prisma.donation.deleteMany({
      where: { OR: [{ backerId: { in: backerIds } }, { streamerId: { in: streamerIds } }] },
    }),
    prisma.mochiHolding.deleteMany({
      where: { OR: [{ backerId: { in: backerIds } }, { streamerId: { in: streamerIds } }] },
    }),
    prisma.marketplaceItem.deleteMany({ where: { streamerId: { in: streamerIds } } }),
    prisma.update.deleteMany({ where: { streamerId: { in: streamerIds } } }),
    prisma.mochiIssuance.deleteMany({ where: { streamerId: { in: streamerIds } } }),
    prisma.streamer.deleteMany({ where: { id: { in: streamerIds } } }),
    prisma.backer.deleteMany({ where: { id: { in: backerIds } } }),
  ]);

  console.log("\nDone. Re-run `pnpm seed:audit --prod` to confirm.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
