/**
 * Fan-facing ranking: "how does my support for this creator compare to their
 * other supporters." Deliberately distinct from the retired Phase-1 founding
 * number (chronological — who backed first) — this ranks by **lifetime mochi
 * earned** (`MochiHolding.mochiEarnedTotal`), a support signal, not an arrival
 * order. See DECISIONS 2026-07-30.
 *
 * Mochi is a donation bonus, not a purchase (see docs/DECISIONS.md, the
 * donation-pivot entry) — kept as the ranking basis deliberately, even though
 * it's a rate-distorted proxy for KRW donated (earlier donors earn more mochi
 * per ₩ than later ones under the ratchet). `MochiHolding.krwPaidTotal` exists
 * as the undistorted alternative if this ever needs revisiting.
 *
 * Computed live, not stored: at this scale (tens of holders per creator) an
 * ORDER BY is cheap, and a stored rank would drift the moment anyone donates.
 */

import { cache } from "react";
import { prisma } from "@/lib/db";

export type MyRanking = {
  streamerId: string;
  handle: string;
  displayName: string;
  category: string;
  balance: number;
  mochiEarnedTotal: number;
  rank: number;
  totalSupporters: number;
};

/**
 * Every creator this backer holds mochi in, with their rank among that
 * creator's supporters (1 = biggest lifetime earner). Empty array if they
 * hold nothing anywhere — ranking only applies to a support relationship,
 * unlike the Sidebar's follow list.
 */
export async function getMyRankings(backerId: string): Promise<MyRanking[]> {
  const holdings = await prisma.mochiHolding.findMany({
    where: { backerId },
    include: {
      streamer: { select: { handle: true, displayName: true, category: true } },
    },
  });
  if (holdings.length === 0) return [];

  /**
   * One grouped query for every creator the user holds, instead of calling
   * `getSupporterRank` per holding.
   *
   * That was an N+1 of N+1s: each call ran three queries (the user's own row,
   * a count of holders ahead, a count of all holders), so a user holding four
   * creators spent 1 + 4x3 = 13 queries just to render the rank line on their
   * home page. Here two grouped reads cover all creators at once: total holders
   * each, and holders ahead of this user's own mochiEarnedTotal.
   */
  const streamerIds = holdings.map((h) => h.streamerId);
  const mine = new Map(holdings.map((h) => [h.streamerId, h.mochiEarnedTotal]));

  const [totals, ahead] = await Promise.all([
    prisma.mochiHolding.groupBy({
      by: ["streamerId"],
      where: { streamerId: { in: streamerIds } },
      _count: { _all: true },
    }),
    // "Holders who earned strictly more than me" can't be expressed per-creator
    // in one groupBy (the threshold differs per row), so fetch the comparison
    // set once and bucket it in memory — still a single query, and the rows are
    // just (streamerId, mochiEarnedTotal) pairs.
    prisma.mochiHolding.findMany({
      where: { streamerId: { in: streamerIds } },
      select: { streamerId: true, mochiEarnedTotal: true },
    }),
  ]);

  const totalByStreamer = new Map(
    totals.map((t) => [t.streamerId, t._count._all]),
  );
  const aheadByStreamer = new Map<string, number>();
  for (const row of ahead) {
    const threshold = mine.get(row.streamerId);
    if (threshold === undefined) continue;
    if (row.mochiEarnedTotal > threshold) {
      aheadByStreamer.set(
        row.streamerId,
        (aheadByStreamer.get(row.streamerId) ?? 0) + 1,
      );
    }
  }

  return holdings.map((h) => ({
    streamerId: h.streamerId,
    handle: h.streamer.handle,
    displayName: h.streamer.displayName,
    category: h.streamer.category,
    balance: h.balance,
    mochiEarnedTotal: h.mochiEarnedTotal,
    // Ties share a rank, same as getSupporterRank: 1 + however many earned more.
    rank: (aheadByStreamer.get(h.streamerId) ?? 0) + 1,
    totalSupporters: totalByStreamer.get(h.streamerId) ?? 0,
  }));
}

/**
 * This backer's rank among ONE creator's supporters, by lifetime mochi
 * earned. `rank` is 1-based; ties share a rank via the count of holders who
 * earned strictly more (so two backers tied for the top both show #1).
 */
export async function getSupporterRank(
  streamerId: string,
  backerId: string,
): Promise<{ rank: number; total: number }> {
  const mine = await prisma.mochiHolding.findUnique({
    where: { streamerId_backerId: { streamerId, backerId } },
    select: { mochiEarnedTotal: true },
  });
  if (!mine) return { rank: 0, total: 0 };

  const [ahead, total] = await Promise.all([
    prisma.mochiHolding.count({
      where: { streamerId, mochiEarnedTotal: { gt: mine.mochiEarnedTotal } },
    }),
    prisma.mochiHolding.count({ where: { streamerId } }),
  ]);
  return { rank: ahead + 1, total };
}

export type LeaderboardEntry = {
  backerId: string;
  nickname: string;
  avatarUrl: string | null;
  mochiEarnedTotal: number;
  rank: number;
};

/**
 * A creator's own supporters, ranked by lifetime mochi earned — the
 * public-facing counterpart to `getSupporterRank`. Replaces the old
 * founding-number "Backer Wall" (a Phase-1 Kickstarter-era concept, unrelated
 * to the mochi model; see DECISIONS 2026-08-01). Same live-computed pattern:
 * cheap at this scale, never drifts out of sync with a donation.
 */
export const getSupporterLeaderboard = cache(async (
  streamerId: string,
  limit = 60,
): Promise<{
  entries: LeaderboardEntry[];
  totalSupporters: number;
  totalMochiEarned: number;
}> => {
  const [holdings, totalSupporters, sum] = await Promise.all([
    prisma.mochiHolding.findMany({
      where: { streamerId, mochiEarnedTotal: { gt: 0 } },
      orderBy: { mochiEarnedTotal: "desc" },
      take: limit,
      include: { backer: { select: { nickname: true, avatarUrl: true } } },
    }),
    prisma.mochiHolding.count({
      where: { streamerId, mochiEarnedTotal: { gt: 0 } },
    }),
    // Sum across ALL supporters, not just the top `limit` shown in `entries`
    // — used for the profile page's headline stat (DECISIONS 2026-08-01).
    prisma.mochiHolding.aggregate({
      where: { streamerId },
      _sum: { mochiEarnedTotal: true },
    }),
  ]);

  // Ties share a rank (two backers tied for the top both show #1).
  let rank = 0;
  let lastValue = -1;
  const entries = holdings.map((h, i) => {
    if (h.mochiEarnedTotal !== lastValue) {
      rank = i + 1;
      lastValue = h.mochiEarnedTotal;
    }
    return {
      backerId: h.backerId,
      nickname: h.backer.nickname,
      avatarUrl: h.backer.avatarUrl,
      mochiEarnedTotal: h.mochiEarnedTotal,
      rank,
    };
  });

  return {
    entries,
    totalSupporters,
    totalMochiEarned: sum._sum.mochiEarnedTotal ?? 0,
  };
});
