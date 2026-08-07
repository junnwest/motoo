import { cache } from "react";
import { prisma } from "@/lib/db";

/**
 * This module used to carry a file-level `"use server"`, which made every
 * export a server action — including the two reads, which are just queries.
 * That also blocked `cache()`, and `getFollowList` is called **twice on every
 * signed-in page** (once by the Sidebar, once by the RightRail), issuing the
 * identical query both times. The directive is now scoped to `toggleFollow`,
 * the only export that is actually a mutation, and the reads are deduplicated
 * per request.
 *
 * Following is the free half of "creators you support" — MochiHolding is the
 * paid half. It costs nothing, so it's what fills the home rail (DECISIONS
 * 2026-07-30) for a creator a user is interested in but hasn't bought mochi
 * from yet. A holding never implies a follow row and vice versa; the rail
 * merges both reads (src/lib/home.ts), it doesn't merge the data itself.
 */

/**
 * The Sidebar's following list — strictly Follow rows, deliberately NOT merged
 * with MochiHolding (DECISIONS 2026-07-30: holding and following stay
 * independent; a paying-but-not-following supporter won't appear here, which
 * is why BuyMochi nudges a follow right after a first purchase).
 */
export const getFollowList = cache(async (backerId: string) => {
  const rows = await prisma.follow.findMany({
    where: { backerId },
    orderBy: { createdAt: "desc" },
    include: {
      streamer: { select: { handle: true, displayName: true, category: true } },
    },
  });
  return rows.map((r) => ({
    streamerId: r.streamerId,
    handle: r.streamer.handle,
    displayName: r.streamer.displayName,
    category: r.streamer.category,
  }));
});

export const isFollowing = cache(async (streamerId: string, backerId: string) => {
  const row = await prisma.follow.findUnique({
    where: { streamerId_backerId: { streamerId, backerId } },
    select: { id: true },
  });
  return !!row;
});
