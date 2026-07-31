"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentBacker } from "@/lib/session";

/**
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
export async function getFollowList(backerId: string) {
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
}

export async function isFollowing(streamerId: string, backerId: string) {
  const row = await prisma.follow.findUnique({
    where: { streamerId_backerId: { streamerId, backerId } },
    select: { id: true },
  });
  return !!row;
}

/** Toggle follow for the signed-in user. Returns the new state. */
export async function toggleFollow(
  streamerId: string,
  handle: string,
): Promise<{ ok: true; following: boolean } | { ok: false; error: string }> {
  const backer = await getCurrentBacker();
  if (!backer) return { ok: false, error: "signedOut" };

  const existing = await prisma.follow.findUnique({
    where: { streamerId_backerId: { streamerId, backerId: backer.id } },
    select: { id: true },
  });

  if (existing) {
    await prisma.follow.delete({ where: { id: existing.id } });
  } else {
    await prisma.follow.create({ data: { streamerId, backerId: backer.id } });
  }

  revalidatePath(`/s/${handle}`);
  revalidatePath("/home");
  return { ok: true, following: !existing };
}
