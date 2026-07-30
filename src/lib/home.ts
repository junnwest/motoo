/**
 * Read-only queries for the signed-in home (`/`).
 *
 * Deliberately NOT in mochi.ts — that file owns the money invariants and is
 * covered by `pnpm test`; these are plain reads for a dashboard and shouldn't
 * widen its surface.
 */

import { prisma } from "@/lib/db";

/**
 * Marketplace items the user can afford **right now** with the balance they
 * already hold for that creator — the home's call to action, and the step of
 * the loop (buy → *spend* → fulfil) that had no surface outside a profile page.
 *
 * Purely a read: redemption still goes through `redeemItem`, which re-checks
 * balance and stock inside its transaction. An item shown here can go stale
 * (stock sells out between render and click) and that's fine — the action path
 * is the one that enforces the invariants.
 */
export async function getAffordableItems(backerId: string, take = 6) {
  const holdings = await prisma.mochiHolding.findMany({
    where: { backerId, balance: { gt: 0 } },
    include: { streamer: { select: { handle: true, displayName: true } } },
  });
  if (holdings.length === 0) return [];

  // One query per held creator (a handful at most), then interleave so a single
  // creator with cheap items can't crowd out everyone else.
  const perCreator = await Promise.all(
    holdings.map(async (h) => {
      const items = await prisma.marketplaceItem.findMany({
        where: {
          streamerId: h.streamerId,
          active: true,
          priceMochi: { lte: h.balance },
        },
        orderBy: { priceMochi: "desc" },
        take: 2,
      });
      return items.map((item) => ({
        item,
        balance: h.balance,
        streamer: h.streamer,
      }));
    }),
  );

  const interleaved: (typeof perCreator)[number] = [];
  const depth = Math.max(...perCreator.map((c) => c.length), 0);
  for (let i = 0; i < depth; i++) {
    for (const creator of perCreator) {
      if (creator[i]) interleaved.push(creator[i]);
    }
  }
  return interleaved.slice(0, take);
}

/**
 * Recent public posts from the creators a user currently holds mochi in — the
 * "reason to come back" section. Returns [] when they hold nothing, so the home
 * can fall back to its discovery-led layout without a second query.
 *
 * Only `public` updates: `backers`/`tier` visibility belongs to the Phase-1
 * backing model, which is retired from the UI.
 */
export async function getUpdatesForBacker(backerId: string, take = 4) {
  const holdings = await prisma.mochiHolding.findMany({
    where: { backerId, balance: { gt: 0 } },
    select: { streamerId: true },
  });
  if (holdings.length === 0) return [];

  return prisma.update.findMany({
    where: {
      streamerId: { in: holdings.map((h) => h.streamerId) },
      visibility: "public",
    },
    orderBy: { publishedAt: "desc" },
    take,
    include: {
      streamer: {
        select: { handle: true, displayName: true, avatarUrl: true },
      },
    },
  });
}
