/**
 * Read-only queries for the signed-in home (`/home`).
 *
 * Deliberately NOT in mochi.ts — that file owns the money invariants and is
 * covered by `pnpm test`; these are plain reads for a dashboard and shouldn't
 * widen its surface.
 */

import { prisma } from "@/lib/db";

export type RailCreator = {
  streamerId: string;
  handle: string;
  displayName: string;
  category: string;
  /** null = followed but no mochi purchased yet. */
  balance: number | null;
};

/**
 * The rail's "creators you support" — the union of who a user holds mochi in
 * (paid) and who they follow (free), deduped by creator. A holding always wins
 * over a bare follow so the rail never shows a balance-holder twice with two
 * rows. See DECISIONS 2026-07-30: one merged list, not two separate surfaces.
 */
export async function getRailCreators(backerId: string): Promise<RailCreator[]> {
  const [holdings, follows] = await Promise.all([
    prisma.mochiHolding.findMany({
      where: { backerId, balance: { gt: 0 } },
      include: {
        streamer: { select: { handle: true, displayName: true, category: true } },
      },
      orderBy: { balance: "desc" },
    }),
    prisma.follow.findMany({
      where: { backerId },
      include: {
        streamer: { select: { handle: true, displayName: true, category: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const seen = new Set(holdings.map((h) => h.streamerId));
  const held: RailCreator[] = holdings.map((h) => ({
    streamerId: h.streamerId,
    handle: h.streamer.handle,
    displayName: h.streamer.displayName,
    category: h.streamer.category,
    balance: h.balance,
  }));
  const followedOnly: RailCreator[] = follows
    .filter((f) => !seen.has(f.streamerId))
    .map((f) => ({
      streamerId: f.streamerId,
      handle: f.streamer.handle,
      displayName: f.streamer.displayName,
      category: f.streamer.category,
      balance: null,
    }));

  return [...held, ...followedOnly];
}

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

  /**
   * One query for every held creator at once, then interleave so a single
   * creator with cheap items can't crowd out everyone else.
   *
   * Was a query per holding. The affordability threshold differs per creator
   * (each has its own balance), which is why this can't be a single `WHERE
   * priceMochi <= ?` — instead it fetches each creator's active items once via
   * an `OR` of per-creator price bounds and buckets them in memory. Same shape
   * as the ranking fix: the per-row condition moves out of the query planner
   * and into a pass over rows we were fetching anyway.
   */
  const items = await prisma.marketplaceItem.findMany({
    where: {
      active: true,

      hiddenAt: null,
      OR: holdings.map((h) => ({
        streamerId: h.streamerId,
        priceMochi: { lte: h.balance },
      })),
    },
    orderBy: { priceMochi: "desc" },
  });

  const byStreamer = new Map(holdings.map((h) => [h.streamerId, h]));
  const grouped = new Map<string, typeof items>();
  for (const item of items) {
    const list = grouped.get(item.streamerId) ?? [];
    // Two per creator, matching the previous per-creator `take: 2`; the list is
    // already price-descending, so the first two are the priciest affordable.
    if (list.length < 2) {
      list.push(item);
      grouped.set(item.streamerId, list);
    }
  }

  const perCreator = holdings.map((h) =>
    (grouped.get(h.streamerId) ?? []).map((item) => ({
      item,
      balance: h.balance,
      streamer: byStreamer.get(h.streamerId)!.streamer,
    })),
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
 * Recent public posts from creators the user supports — held **or** followed,
 * matching the rail's merged list (a followed-only creator's posts are exactly
 * as relevant as a held one's). Returns [] when the user supports no one, so
 * the home can fall back to its discovery-led layout without a second query.
 *
 * Only `public` updates: `backers`/`tier` visibility belongs to the Phase-1
 * backing model, which is retired from the UI.
 */
export async function getUpdatesForBacker(backerId: string, take = 4) {
  const [holdings, follows] = await Promise.all([
    prisma.mochiHolding.findMany({
      where: { backerId, balance: { gt: 0 } },
      select: { streamerId: true },
    }),
    prisma.follow.findMany({ where: { backerId }, select: { streamerId: true } }),
  ]);
  const streamerIds = [
    ...new Set([...holdings, ...follows].map((r) => r.streamerId)),
  ];
  if (streamerIds.length === 0) return [];

  return prisma.update.findMany({
    where: {
      streamerId: { in: streamerIds },
      visibility: "public",
      hiddenAt: null, // admin takedown (PRELAUNCH #15)
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

/**
 * The mirror of `getAffordableItems`: things this fan can't reach yet, with how
 * much more they'd need. Same shape and the same reason for it — the
 * affordability threshold differs per creator, so the per-row condition lives
 * in a pass over rows rather than in the query planner.
 *
 * Cheapest-first, unlike affordable items (priciest-first): the useful answer
 * to "what can't I afford" is the thing you're closest to, not the thing you're
 * furthest from. Items priced at or below the balance are excluded — those are
 * already the other section's job.
 */
export async function getOutOfReachItems(backerId: string, take = 3) {
  const holdings = await prisma.mochiHolding.findMany({
    where: { backerId },
    include: { streamer: { select: { handle: true, displayName: true } } },
  });
  if (holdings.length === 0) return [];

  const items = await prisma.marketplaceItem.findMany({
    where: {
      active: true,
      hiddenAt: null,
      OR: holdings.map((h) => ({
        streamerId: h.streamerId,
        priceMochi: { gt: h.balance },
      })),
    },
    orderBy: { priceMochi: "asc" },
  });

  const byStreamer = new Map(holdings.map((h) => [h.streamerId, h]));
  const seen = new Map<string, number>();
  const out: {
    item: (typeof items)[number];
    balance: number;
    shortfall: number;
    streamer: { handle: string; displayName: string };
  }[] = [];

  for (const item of items) {
    // One per creator, so a single creator's price list can't fill the section.
    if ((seen.get(item.streamerId) ?? 0) >= 1) continue;
    seen.set(item.streamerId, (seen.get(item.streamerId) ?? 0) + 1);
    const h = byStreamer.get(item.streamerId)!;
    out.push({
      item,
      balance: h.balance,
      shortfall: item.priceMochi - h.balance,
      streamer: h.streamer,
    });
  }

  // Closest to reach first, across creators.
  out.sort((a, b) => a.shortfall - b.shortfall);
  return out.slice(0, take);
}
