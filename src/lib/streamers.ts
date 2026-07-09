import { prisma } from "./db";
import type { TrustGrades, TrustMetrics, Grade } from "./grades";
import { gradeRank } from "./grades";

export interface StreamerCard {
  handle: string;
  displayName: string;
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
    handle: string;
    displayName: string;
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
    handle: streamer.handle,
    displayName: streamer.displayName,
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

/** Full profile with tiers, backer wall, updates, and published report summary. */
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
    },
  });
  if (!streamer || streamer.status !== "approved") return null;

  // Backer Wall — ordered by founding number, one row per backing (paid only).
  const wall = await prisma.backing.findMany({
    where: { streamerId: streamer.id, status: "paid" },
    orderBy: { foundingNumber: "asc" },
    select: {
      id: true,
      foundingNumber: true,
      display: true,
      displayName: true,
      message: true,
      createdAt: true,
      backer: { select: { nickname: true } },
      tier: { select: { name: true } },
    },
  });

  // Dedup wall to one entry per founding number (a backer's first backing).
  const seen = new Set<number>();
  const backerWall = wall.filter((w) => {
    if (seen.has(w.foundingNumber)) return false;
    seen.add(w.foundingNumber);
    return true;
  });

  const report = streamer.reports[0];
  return {
    streamer,
    tiers: streamer.tiers,
    updates: streamer.updates,
    backerWall,
    report: report
      ? {
          ...report,
          metrics: report.metrics as unknown as TrustMetrics,
          grades: report.grades as unknown as TrustGrades,
        }
      : null,
    backerCount: seen.size,
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
