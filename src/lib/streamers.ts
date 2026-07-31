import { prisma } from "./db";
import type { TrustGrades, TrustMetrics, Grade } from "./grades";
import { gradeRank } from "./grades";

export interface StreamerCard {
  id: string;
  handle: string;
  displayName: string;
  creatorType: string | null;
  category: string;
  avatarUrl: string | null;
  avgViewers: number;
  backerCount: number;
  recurringRate: number;
  fulfillmentRate: number;
  readiness: Grade;
  createdAt: Date;
}

function reportToCard(
  streamer: {
    id: string;
    handle: string;
    displayName: string;
    creatorType: string | null;
    category: string;
    avatarUrl: string | null;
    avgViewers: number;
    createdAt: Date;
    reports: { metrics: unknown; grades: unknown }[];
  },
): StreamerCard {
  const report = streamer.reports[0];
  const metrics = report?.metrics as TrustMetrics | undefined;
  const grades = report?.grades as TrustGrades | undefined;
  return {
    id: streamer.id,
    handle: streamer.handle,
    displayName: streamer.displayName,
    creatorType: streamer.creatorType,
    category: streamer.category,
    avatarUrl: streamer.avatarUrl,
    avgViewers: streamer.avgViewers,
    backerCount: metrics?.fanSupport.totalBackers ?? 0,
    recurringRate: metrics?.fanSupport.recurringRate ?? 0,
    fulfillmentRate: metrics?.execution.perkFulfillmentRate ?? 0,
    readiness: grades?.sponsorReadiness ?? "Emerging",
    createdAt: streamer.createdAt,
  };
}

export type ExploreSort = "readiness" | "backers" | "recurring" | "newest";

export interface ExploreParams {
  q?: string;
  type?: string;
  category?: string;
  backerRange?: "all" | "under50" | "50to200" | "over200";
  sort?: ExploreSort;
}

/**
 * Explore listing. Ranked by TRUST SIGNALS, never money raised (spec §6) —
 * there is deliberately no "top earners" sort option.
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
      reports: { orderBy: { reportNumber: "desc" }, take: 1 },
    },
  });

  let cards = streamers.map(reportToCard);

  if (params.backerRange && params.backerRange !== "all") {
    cards = cards.filter((c) => {
      if (params.backerRange === "under50") return c.backerCount < 50;
      if (params.backerRange === "50to200")
        return c.backerCount >= 50 && c.backerCount <= 200;
      return c.backerCount > 200;
    });
  }

  const sort = params.sort ?? "readiness";
  cards.sort((a, b) => {
    switch (sort) {
      case "backers":
        return b.backerCount - a.backerCount;
      case "recurring":
        return b.recurringRate - a.recurringRate;
      case "newest":
        return b.createdAt.getTime() - a.createdAt.getTime();
      case "readiness":
      default:
        return (
          gradeRank(b.readiness) - gradeRank(a.readiness) ||
          b.recurringRate - a.recurringRate
        );
    }
  });

  return cards;
}

/**
 * Full profile with tiers, updates, and published report summary. The
 * supporter leaderboard (live mochi-purchase ranking) is a separate call —
 * `getSupporterLeaderboard` in `@/lib/ranking` — not folded in here.
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
      reports: {
        where: { status: "published" },
        orderBy: { reportNumber: "desc" },
        take: 1,
      },
      // Phase 2: active marketplace items, so the profile page renders the
      // spend module from this one streamer query (no second fetch). Buy
      // (mochiIssuance) moved to its own page/query — getStreamerMarketplace,
      // used by /s/[handle]/buy — since it's no longer rendered here.
      marketplaceItems: {
        where: { active: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });
  if (!streamer || streamer.status !== "approved") return null;

  const report = streamer.reports[0];
  return {
    streamer,
    tiers: streamer.tiers,
    updates: streamer.updates,
    report: report
      ? {
          ...report,
          metrics: report.metrics as unknown as TrustMetrics,
          grades: report.grades as unknown as TrustGrades,
        }
      : null,
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
