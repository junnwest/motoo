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
}

/**
 * Explore listing. `backerCount` is a live `MochiHolding` count — a holding
 * row only exists once a fan has actually purchased mochi (DECISIONS
 * 2026-08-01), never a stored/derived metric. Ranked by real support, never
 * money raised (spec §6) — there is deliberately no "top earners" sort.
 */
export async function getExploreStreamers(
  params: ExploreParams = {},
): Promise<StreamerCard[]> {
  const streamers = await prisma.streamer.findMany({
    where: {
      status: "approved",
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
export async function getStreamerProfile(handle: string) {
  const streamer = await prisma.streamer.findUnique({
    where: { handle },
    include: {
      tiers: {
        where: { active: true },
        orderBy: { sortOrder: "asc" },
        include: { perks: true },
      },
      updates: { orderBy: { publishedAt: "desc" }, take: 5 },
      // Phase 2: active marketplace items, so the profile page renders the
      // spend module from this one streamer query (no second fetch). Donate
      // (mochiIssuance) moved to its own page/query — getStreamerMarketplace,
      // used by /s/[handle]/donate — since it's no longer rendered here.
      marketplaceItems: {
        where: { active: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });
  if (!streamer || streamer.status !== "approved") return null;

  return {
    streamer,
    tiers: streamer.tiers,
    updates: streamer.updates,
  };
}

/** Data needed by the backing flow. */
export async function getStreamerForBacking(handle: string) {
  return prisma.streamer.findUnique({
    where: { handle },
    include: {
      tiers: {
        where: { active: true },
        orderBy: { sortOrder: "asc" },
        include: { perks: true },
      },
    },
  });
}

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
        where: { active: true },
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
