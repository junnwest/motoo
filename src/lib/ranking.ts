/**
 * Fan-facing ranking: "how does my support for this creator compare to their
 * other supporters." Deliberately distinct from the retired Phase-1 founding
 * number (chronological — who backed first) — this ranks by **lifetime mochi
 * purchased** (`MochiHolding.purchasedTotal`), a money signal, not an arrival
 * order. See DECISIONS 2026-07-30.
 *
 * Computed live, not stored: at this scale (tens of holders per creator) an
 * ORDER BY is cheap, and a stored rank would drift the moment anyone buys.
 */

import { prisma } from "@/lib/db";

export type MyRanking = {
  streamerId: string;
  handle: string;
  displayName: string;
  category: string;
  balance: number;
  purchasedTotal: number;
  rank: number;
  totalSupporters: number;
};

/**
 * Every creator this backer holds mochi in, with their rank among that
 * creator's supporters (1 = biggest lifetime purchaser). Empty array if they
 * hold nothing anywhere — ranking only applies to a money relationship, unlike
 * the Sidebar's follow list.
 */
export async function getMyRankings(backerId: string): Promise<MyRanking[]> {
  const holdings = await prisma.mochiHolding.findMany({
    where: { backerId },
    include: {
      streamer: { select: { handle: true, displayName: true, category: true } },
    },
  });
  if (holdings.length === 0) return [];

  return Promise.all(
    holdings.map(async (h) => {
      const { rank, total } = await getSupporterRank(h.streamerId, backerId);
      return {
        streamerId: h.streamerId,
        handle: h.streamer.handle,
        displayName: h.streamer.displayName,
        category: h.streamer.category,
        balance: h.balance,
        purchasedTotal: h.purchasedTotal,
        rank,
        totalSupporters: total,
      };
    }),
  );
}

/**
 * This backer's rank among ONE creator's supporters, by lifetime purchased.
 * `rank` is 1-based; ties share a rank via the count of holders who bought
 * strictly more (so two backers tied for the top both show #1).
 */
export async function getSupporterRank(
  streamerId: string,
  backerId: string,
): Promise<{ rank: number; total: number }> {
  const mine = await prisma.mochiHolding.findUnique({
    where: { streamerId_backerId: { streamerId, backerId } },
    select: { purchasedTotal: true },
  });
  if (!mine) return { rank: 0, total: 0 };

  const [ahead, total] = await Promise.all([
    prisma.mochiHolding.count({
      where: { streamerId, purchasedTotal: { gt: mine.purchasedTotal } },
    }),
    prisma.mochiHolding.count({ where: { streamerId } }),
  ]);
  return { rank: ahead + 1, total };
}
