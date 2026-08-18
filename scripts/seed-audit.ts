/**
 * What the dev seed left in a database, and what removing it would destroy.
 *
 * The seed ran against **production** at some point (discovered 2026-08-18 while
 * debugging admin access: `fan*@motoo.dev` accounts were in the live database).
 * Those rows are still counted in every leaderboard, supporter total and
 * headline stat on the live site.
 *
 * Deleting them is not a one-liner, because the cascades reach real data:
 * removing a seeded *creator* takes their marketplace items, orders and mochi
 * holdings with them — including any belonging to a real fan who found that
 * creator and supported them. This script answers that question before anything
 * is deleted, and deletes nothing itself.
 *
 *   pnpm seed:audit            # local database
 *   pnpm seed:audit --prod     # production, read-only
 *
 * Seed rows are identified the same way the seed creates them: accounts on
 * `@motoo.dev`, and the ten `creatorA`…`creatorJ` handles. Anything else is
 * treated as real, which is the safe direction to be wrong in.
 */
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";

const SEED_EMAIL_SUFFIX = "@motoo.dev";
const SEED_HANDLES = [
  "creatorA", "creatorB", "creatorC", "creatorD", "creatorE",
  "creatorF", "creatorG", "creatorH", "creatorI", "creatorJ",
];

function productionUrl(): string {
  const env = readFileSync(".env.production.local", "utf8");
  const m = /^DIRECT_URL\s*=\s*"?([^"\n\r]+)"?/m.exec(env);
  if (!m) throw new Error("No DIRECT_URL in .env.production.local");
  return m[1].trim();
}

const useProd = process.argv.includes("--prod");
const prisma = useProd
  ? new PrismaClient({ datasourceUrl: productionUrl() })
  : new PrismaClient();

async function main() {
  console.log(useProd ? "Target: PRODUCTION (read-only)\n" : "Target: local\n");

  const seedBackers = await prisma.backer.findMany({
    where: { email: { endsWith: SEED_EMAIL_SUFFIX } },
    select: { id: true, email: true, role: true },
  });
  const seedStreamers = await prisma.streamer.findMany({
    where: { handle: { in: SEED_HANDLES } },
    select: { id: true, handle: true, displayName: true },
  });
  const seedBackerIds = seedBackers.map((b) => b.id);
  const seedStreamerIds = seedStreamers.map((s) => s.id);

  console.log(`seeded accounts:  ${seedBackers.length}`);
  console.log(`seeded creators:  ${seedStreamers.length}`);
  if (seedBackers.length === 0 && seedStreamers.length === 0) {
    console.log("\nNothing to clean up.");
    return;
  }

  // The question that decides whether this is safe: has anyone real touched
  // the seeded creators? A holding, an order or a donation from a non-seed
  // account is real support that a cascade would silently destroy.
  const realHoldings = await prisma.mochiHolding.count({
    where: { streamerId: { in: seedStreamerIds }, backerId: { notIn: seedBackerIds } },
  });
  const realOrders = await prisma.order.count({
    where: { streamerId: { in: seedStreamerIds }, backerId: { notIn: seedBackerIds } },
  });
  const realDonations = await prisma.donation.count({
    where: { streamerId: { in: seedStreamerIds }, backerId: { notIn: seedBackerIds } },
  });
  const realFollows = await prisma.follow.count({
    where: { streamerId: { in: seedStreamerIds }, backerId: { notIn: seedBackerIds } },
  });

  // And the mirror: does a seeded account hold anything from a real creator?
  const seedHoldingsOnRealCreators = await prisma.mochiHolding.count({
    where: { backerId: { in: seedBackerIds }, streamerId: { notIn: seedStreamerIds } },
  });

  console.log("\nReal activity attached to seeded creators");
  console.log(`  mochi holdings by real fans: ${realHoldings}`);
  console.log(`  orders by real fans:         ${realOrders}`);
  console.log(`  donations by real fans:      ${realDonations}`);
  console.log(`  follows by real fans:        ${realFollows}`);
  console.log(`  seed fans holding real creators' mochi: ${seedHoldingsOnRealCreators}`);

  const blocked = realHoldings + realOrders + realDonations;
  console.log(
    blocked === 0
      ? "\n✓ Safe to delete: no real fan has any balance, order or donation with a seeded creator."
      : `\n✗ NOT safe to delete outright: ${blocked} real record(s) would be destroyed.\n` +
        "  A real fan holds mochi, has an order, or has donated to a seeded creator.\n" +
        "  Deleting that creator would erase the balance they paid for.",
  );

  // Name the blockers. "One record" is not actionable; knowing whether that
  // fan actually paid anything is.
  if (blocked > 0) {
    const rows = await prisma.mochiHolding.findMany({
      where: {
        streamerId: { in: seedStreamerIds },
        backerId: { notIn: seedBackerIds },
      },
      select: {
        balance: true,
        mochiEarnedTotal: true,
        krwPaidTotal: true,
        backer: { select: { email: true } },
        streamer: { select: { handle: true } },
      },
    });
    console.log("\n  Blocking holdings:");
    for (const r of rows) {
      console.log(
        `    ${r.backer.email} → @${r.streamer.handle}: ` +
          `balance ${r.balance}, earned ${r.mochiEarnedTotal}, paid ${r.krwPaidTotal} KRW`,
      );
    }
  }

  // What the site is currently overstating, whatever is decided.
  const totalBackers = await prisma.backer.count();
  const totalStreamers = await prisma.streamer.count();
  console.log(
    `\nHow much of the live site is fake: ` +
      `${seedBackers.length}/${totalBackers} accounts, ` +
      `${seedStreamers.length}/${totalStreamers} creators.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
