import { cache } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "./db";

export interface StreamerCard {
  id: string;
  handle: string;
  displayName: string;
  creatorType: string | null;
  category: string;
  avatarUrl: string | null;
  avgViewers: number;
  backerCount: number;
  createdAt: Date;
}

function toStreamerCard(streamer: {
  id: string;
  handle: string;
  displayName: string;
  creatorType: string | null;
  category: string;
  avatarUrl: string | null;
  avgViewers: number;
  createdAt: Date;
  _count: { mochiHoldings: number };
}): StreamerCard {
  return {
    id: streamer.id,
    handle: streamer.handle,
    displayName: streamer.displayName,
    creatorType: streamer.creatorType,
    category: streamer.category,
    avatarUrl: streamer.avatarUrl,
    avgViewers: streamer.avgViewers,
    backerCount: streamer._count.mochiHoldings,
    createdAt: streamer.createdAt,
  };
}

export type ExploreSort = "backers" | "newest";

export interface ExploreParams {
  q?: string;
  type?: string;
  category?: string;
  backerRange?: "all" | "under50" | "50to200" | "over200";
  sort?: ExploreSort;
  /** Creators the signed-in fan has hidden. Omitted when nobody is signed in. */
  hiddenStreamerIds?: string[];
  /** Zero-based page. */
  page?: number;
  pageSize?: number;
}

/**
 * Explore listing. `backerCount` is a live `MochiHolding` count — a holding
 * row only exists once a fan has actually purchased mochi (DECISIONS
 * 2026-08-01), never a stored/derived metric. Ranked by real support, never
 * money raised (spec §6) — there is deliberately no "top earners" sort.
 */
/**
 * How many creators one Explore request may load.
 *
 * There was no limit at all: the query fetched **every** approved creator with
 * a `_count` subquery each, then filtered and sorted the whole set in
 * JavaScript. At seed scale that's invisible; at a few thousand creators it is
 * a full table scan plus N correlated subqueries, and it ran on *every signed-in
 * page* — not just /explore — because the RightRail calls this to build its
 * discovery list.
 *
 * A cap rather than real pagination: the UI has no pager yet (that's still
 * open), so this bounds the damage without changing the page's contract. Wire
 * `skip` through when the pager lands.
 */
export const EXPLORE_PAGE_SIZE = 60;

/**
 * The ids matching a supporter-count band.
 *
 * `backerCount` is a live relation count, and Prisma cannot filter on one in a
 * `where` — which is why this filter used to run in JavaScript *after* the
 * query, over whichever rows the page happened to load. That was survivable
 * while the page was a single capped list and becomes wrong the moment there
 * are pages: page 2 would filter a different 60 rows and the counts would not
 * add up.
 *
 * A grouped query with `having` answers it in the database instead. Note the
 * inversion for `under50`: creators with no supporters at all have no rows in
 * MochiHolding, so they can only be found by excluding everyone who *does*
 * clear the bar.
 */
async function idsForBackerRange(
  range: NonNullable<ExploreParams["backerRange"]>,
): Promise<{ in?: string[]; notIn?: string[] }> {
  if (range === "under50") {
    const atLeast50 = await prisma.mochiHolding.groupBy({
      by: ["streamerId"],
      _count: { _all: true },
      having: { streamerId: { _count: { gte: 50 } } },
    });
    return { notIn: atLeast50.map((r) => r.streamerId) };
  }

  const rows = await prisma.mochiHolding.groupBy({
    by: ["streamerId"],
    _count: { _all: true },
    having:
      range === "50to200"
        ? { streamerId: { _count: { gte: 50, lte: 200 } } }
        : { streamerId: { _count: { gt: 200 } } },
  });
  return { in: rows.map((r) => r.streamerId) };
}

export interface ExplorePage {
  cards: StreamerCard[];
  /** Whether a further page exists — the pager needs this, not a total count. */
  hasMore: boolean;
}

/**
 * One page of the explore listing.
 *
 * Sorting and filtering both moved into the database (docs/PRELAUNCH.md #24).
 * They used to happen in memory over a capped fetch, which was fine for a
 * single unpaged list and is simply incorrect with a pager: "most supported"
 * would have meant "most supported among the 60 rows this page happened to
 * load", and page 2 would have re-sorted a different 60.
 *
 * `take: size + 1` is how `hasMore` is known without a second count query — the
 * extra row is asked for and then dropped.
 */
export async function getExploreStreamers(
  params: ExploreParams = {},
): Promise<ExplorePage> {
  // Creators this fan has hidden are gone from browse entirely. Passed in by
  // the caller rather than read here, because this function also serves the
  // signed-out landing, where there is nobody to have hidden anything.
  const hidden = params.hiddenStreamerIds ?? [];
  const page = Math.max(0, params.page ?? 0);
  const size = params.pageSize ?? EXPLORE_PAGE_SIZE;

  const range =
    params.backerRange && params.backerRange !== "all"
      ? await idsForBackerRange(params.backerRange)
      : null;

  // Both constraints land on `id`, so they are merged rather than written twice
  // — the later spread would otherwise silently drop the earlier one.
  const idFilter: { in?: string[]; notIn?: string[] } = {};
  if (range?.in) idFilter.in = range.in;
  const excluded = [...hidden, ...(range?.notIn ?? [])];
  if (excluded.length > 0) idFilter.notIn = excluded;

  const streamers = await prisma.streamer.findMany({
    where: {
      status: "approved",
      ...(Object.keys(idFilter).length > 0 ? { id: idFilter } : {}),
      ...(params.type && params.type !== "all"
        ? { creatorType: params.type }
        : {}),
      ...(params.category && params.category !== "all"
        ? { category: params.category }
        : {}),
      ...(params.q
        ? {
            OR: [
              { displayName: { contains: params.q, mode: "insensitive" } },
              { handle: { contains: params.q, mode: "insensitive" } },
              { category: { contains: params.q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      _count: { select: { mochiHoldings: true } },
    },
    orderBy:
      (params.sort ?? "backers") === "newest"
        ? { createdAt: "desc" }
        : // Ordering by a relation count, which Postgres does with a join and
          // a GROUP BY rather than the in-memory sort this replaces. `handle`
          // breaks ties so the order is total: without it, equal-count rows can
          // come back in a different order per query and a creator could appear
          // on two pages or on none.
          [{ mochiHoldings: { _count: "desc" as const } }, { handle: "asc" as const }],
    skip: page * size,
    take: size + 1,
  });

  const hasMore = streamers.length > size;
  return {
    cards: streamers.slice(0, size).map(toStreamerCard),
    hasMore,
  };
}

/**
 * Full profile with tiers and updates. The supporter leaderboard (live
 * mochi-purchase ranking) is a separate call — `getSupporterLeaderboard` in
 * `@/lib/ranking` — not folded in here. No Trust Report data (DECISIONS
 * 2026-08-01: not part of 1.0.0) — the `reports` relation still exists on
 * the schema, just unread from here.
 */
export const getStreamerProfile = cache(async (handle: string) => {
  const streamer = await prisma.streamer.findUnique({
    where: { handle },
    include: {
      updates: { orderBy: { publishedAt: "desc" }, take: 5 },
      // Phase 2: active marketplace items, so the profile page renders the
      // spend module from this one streamer query (no second fetch). Donate
      // (mochiIssuance) moved to its own page/query — getStreamerMarketplace,
      // used by /s/[handle]/donate — since it's no longer rendered here.
      marketplaceItems: {
        where: { active: true, hiddenAt: null },
        orderBy: { sortOrder: "asc" },
      },
    },
  });
  if (!streamer || streamer.status !== "approved") return null;

  return {
    streamer,
    updates: streamer.updates,
  };
});

// ── Phase 2: mochi-marketplace reads ─────────────────────────────────────────

/**
 * Public marketplace view for a creator: profile + mochi issuance + active items.
 * Used by the buy-mochi module and the marketplace section on the profile page.
 */
export async function getStreamerMarketplace(handle: string) {
  const streamer = await prisma.streamer.findUnique({
    where: { handle },
    include: {
      mochiIssuance: true,
      marketplaceItems: {
        where: { active: true, hiddenAt: null },
        orderBy: { sortOrder: "asc" },
      },
    },
  });
  if (!streamer || streamer.status !== "approved") return null;
  return streamer;
}

/** Everything the creator dashboard needs: profile, issuance, items, orders. */
export async function getCreatorDashboard(streamerId: string) {
  return prisma.streamer.findUnique({
    where: { id: streamerId },
    include: {
      mochiIssuance: true,
      marketplaceItems: { orderBy: { sortOrder: "asc" } },
      orders: {
        orderBy: { createdAt: "desc" },
        include: {
          item: { select: { title: true } },
          backer: { select: { nickname: true } },
        },
      },
      _count: { select: { mochiHoldings: true } },
    },
  });
}

/**
 * The discovery list shown in the RightRail.
 *
 * Identical for every user, yet it was recomputed on **every signed-in page
 * render** — the rail is part of ConsumerShell, so browsing five pages ran the
 * creator scan five times over. Cached across requests rather than merely per
 * request: "who is trending" does not need to be second-accurate, and a minute
 * of staleness removes the single most repeated query on the site.
 *
 * Deliberately NOT used by /explore, which is a user-driven query and should
 * reflect a new filter, follow, or creator immediately.
 */
export const getTrendingCreators = unstable_cache(
  // Just the cards: the rail shows six and has no pager, so `hasMore`
  // would only be a cached value nobody reads.
  async () => (await getExploreStreamers({ sort: "backers" })).cards,
  ["trending-creators"],
  { revalidate: 60, tags: ["creators"] },
);

/**
 * A creator's own updates, for the Studio composer — every visibility, newest
 * first. The public read path (`getStreamerProfile`, `getUpdatesForBacker`)
 * filters by visibility; this one deliberately does not, because a creator
 * needs to see what they posted regardless of who it was for.
 */
export async function getUpdatesForCreator(streamerId: string, take = 30) {
  return prisma.update.findMany({
    where: { streamerId },
    orderBy: { publishedAt: "desc" },
    take,
  });
}
