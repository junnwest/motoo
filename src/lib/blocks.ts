import { cache } from "react";
import { prisma } from "@/lib/db";

/**
 * Blocking, in both directions (docs/PRELAUNCH.md #13).
 *
 * Two different needs share one table:
 *
 *   - **fan → creator** ("숨기기") is curation. The creator disappears from
 *     explore, discovery and notifications for that fan. It is not punitive and
 *     the creator is never told.
 *   - **creator → fan** ("차단") is safety. The fan can no longer donate to
 *     them, follow them, or appear on their supporter leaderboard.
 *
 * The asymmetry that matters: a creator block stops money going *in*, never
 * mochi already held from being spent. Blocking a supporter would otherwise
 * confiscate their balance, and refusing someone's money is a creator's right
 * in a way that keeping it is not. `redeemItem` is deliberately not gated on
 * this; `donateMochi` is.
 */

/** Creators this fan has hidden. Empty array, never null, so callers can spread. */
export const getHiddenStreamerIds = cache(
  async (backerId: string): Promise<string[]> => {
    const rows = await prisma.block.findMany({
      where: { backerId, initiator: "fan" },
      select: { streamerId: true },
    });
    return rows.map((r) => r.streamerId);
  },
);

/** Fans this creator has blocked. */
export const getBlockedBackerIds = cache(
  async (streamerId: string): Promise<string[]> => {
    const rows = await prisma.block.findMany({
      where: { streamerId, initiator: "creator" },
      select: { backerId: true },
    });
    return rows.map((r) => r.backerId);
  },
);

/**
 * Is there a block between these two, in either direction?
 *
 * Used by everything social (follow, notifications) where the direction does
 * not change the answer — a hidden creator's post is as unwanted as a blocked
 * fan's follow. The money path asks the narrower question below instead.
 */
export async function isBlockedEitherWay(
  streamerId: string,
  backerId: string,
): Promise<boolean> {
  const row = await prisma.block.findFirst({
    where: { streamerId, backerId },
    select: { id: true },
  });
  return !!row;
}

/** The hidden creators themselves, for the undo list in /settings. */
export async function getHiddenCreators(backerId: string) {
  const rows = await prisma.block.findMany({
    where: { backerId, initiator: "fan" },
    orderBy: { createdAt: "desc" },
    select: {
      streamer: {
        select: { id: true, handle: true, displayName: true, avatarUrl: true },
      },
    },
  });
  return rows.map((r) => r.streamer);
}

/**
 * The creator's own supporter list for the Studio — including the ones they
 * have blocked, marked as such.
 *
 * Deliberately not `getSupporterLeaderboard`, which now filters blocked fans
 * out: that is right for the public page and wrong here, because a list that
 * dropped them the moment they were blocked would leave no way to undo it.
 */
export async function getSupportersForStudio(streamerId: string, take = 100) {
  const [holdings, blocked] = await Promise.all([
    prisma.mochiHolding.findMany({
      where: { streamerId },
      orderBy: { mochiEarnedTotal: "desc" },
      take,
      select: {
        backerId: true,
        balance: true,
        mochiEarnedTotal: true,
        backer: { select: { nickname: true, avatarUrl: true } },
      },
    }),
    getBlockedBackerIds(streamerId),
  ]);
  const blockedSet = new Set(blocked);

  return holdings.map((h) => ({
    backerId: h.backerId,
    nickname: h.backer.nickname,
    avatarUrl: h.backer.avatarUrl,
    balance: h.balance,
    mochiEarnedTotal: h.mochiEarnedTotal,
    blocked: blockedSet.has(h.backerId),
  }));
}

/** Has this creator blocked this fan? The only direction that stops money. */
export async function isBlockedByCreator(
  streamerId: string,
  backerId: string,
): Promise<boolean> {
  const row = await prisma.block.findUnique({
    where: {
      backerId_streamerId_initiator: {
        backerId,
        streamerId,
        initiator: "creator",
      },
    },
    select: { id: true },
  });
  return !!row;
}
