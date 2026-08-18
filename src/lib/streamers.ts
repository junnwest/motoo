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

export async function getExploreStreamers(
  params: ExploreParams = {},
): Promise<StreamerCard[]> {
  // Creators this fan has hidden are gone from browse entirely. Passed in by
  // the caller rather than read here, because this function also serves the
  // signed-out landing, where there is nobody to have hidden anything.
  const hidden = params.hiddenStreamerIds ?? [];

  const streamers = await prisma.streamer.findMany({
    where: {
      status: "approved",
      ...(hidden.length > 0 ? { id: { notIn: hidden } } : {}),
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
    // `newest` is orderable in the database; `backers` is a relation count and
    // is still sorted below. The take applies either way, so the unbounded
    // fetch is gone regardless of sort.
    ...(params.sort === "newest"
      ? { orderBy: { createdAt: "desc" as const } }
      : {}),
    take: EXPLORE_PAGE_SIZE,
  });

  let cards = streamers.map(toStreamerCard);

  if (params.backerRange && params.backerRange !== "all") {
    cards = cards.filter((c) => {
      if (params.backerRange === "under50") return c.backerCount < 50;
      if (params.backerRange === "50to200")
        return c.backerCount >= 50 && c.backerCount <= 200;
      return c.backerCount > 200;
    });
  }

  const sort = params.sort ?? "backers";
  cards.sort((a, b) => {
    switch (sort) {
      case "newest":
        return b.createdAt.getTime() - a.createdAt.getTime();
      case "backers":
      default:
        return b.backerCount - a.backerCount;
    }
  });

  return cards;
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
  async () => getExploreStreamers({ sort: "backers" }),
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
