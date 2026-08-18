/**
 * Notification creation + reads.
 *
 * Creation is called from the server actions that trigger it (studio/actions.ts)
 * — deliberately NOT from inside mochi.ts's transactions. A notification is a
 * side effect, not a money invariant: `notify()` swallows its own errors so a
 * failed insert can never roll back or fail the order/item/price action that
 * triggered it. This mirrors home.ts staying out of mochi.ts's tested surface.
 */

import { cache } from "react";
import { prisma } from "@/lib/db";
import { filterByPreference } from "@/lib/notificationPrefs";
import type { NotificationType } from "@prisma/client";

type NotifyInput = {
  backerId: string;
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
};

/** Queue one notification. Never throws — a notification is best-effort. */
export async function notify(input: NotifyInput) {
  try {
    // Preferences are enforced here, not at the ~7 call sites, for the same
    // reason blocks are: one place to be right, and the next notification type
    // someone adds inherits it without having to know it exists.
    const [allowed] = await filterByPreference([input.backerId], input.type);
    if (!allowed) return;
    await prisma.notification.create({ data: input });
  } catch (err) {
    console.error("notify() failed", err);
  }
}

/** Queue the same notification for several recipients at once. Never throws. */
export async function notifyMany(
  backerIds: string[],
  rest: Omit<NotifyInput, "backerId">,
) {
  const unique = await filterByPreference([...new Set(backerIds)], rest.type);
  if (unique.length === 0) return;
  try {
    await prisma.notification.createMany({
      data: unique.map((backerId) => ({ backerId, ...rest })),
    });
  } catch (err) {
    console.error("notifyMany() failed", err);
  }
}

/** Every backer with a stake in a creator: holds mochi in them OR follows them. */
export async function getStakeholderBackerIds(
  streamerId: string,
): Promise<string[]> {
  const [holders, followers] = await Promise.all([
    prisma.mochiHolding.findMany({
      where: { streamerId },
      select: { backerId: true },
    }),
    prisma.follow.findMany({
      where: { streamerId },
      select: { backerId: true },
    }),
  ]);
  return dropBlocked(
    streamerId,
    [...holders, ...followers].map((r) => r.backerId),
  );
}

/**
 * Blocking is a rule about contact, so it is applied where recipients are
 * chosen rather than at each call site — every notice a creator generates goes
 * through one of the two helpers here, and a new one inherits the rule for
 * free. Either direction removes someone: a fan who hid a creator does not want
 * their posts, and a creator who blocked a fan does not want to reach them.
 */
async function dropBlocked(
  streamerId: string,
  backerIds: string[],
): Promise<string[]> {
  if (backerIds.length === 0) return [];
  const blocked = await prisma.block.findMany({
    where: { streamerId, backerId: { in: backerIds } },
    select: { backerId: true },
  });
  if (blocked.length === 0) return backerIds;
  const drop = new Set(blocked.map((b) => b.backerId));
  return backerIds.filter((id) => !drop.has(id));
}

/** Just the holders — used for money-adjacent notices like a price raise. */
export async function getHolderBackerIds(streamerId: string): Promise<string[]> {
  const holders = await prisma.mochiHolding.findMany({
    where: { streamerId },
    select: { backerId: true },
  });
  return dropBlocked(
    streamerId,
    holders.map((r) => r.backerId),
  );
}

export async function getNotificationsForBacker(backerId: string, take = 30) {
  return prisma.notification.findMany({
    where: { backerId },
    orderBy: { createdAt: "desc" },
    take,
  });
}

/**
 * One page of notification history (docs/PRELAUNCH.md #24).
 *
 * The list was capped at 60 with no way past it, so a busy account's older
 * notices — including the money-adjacent ones, like a price raise — were simply
 * unreachable. `take: size + 1` answers "is there another page" without a
 * second COUNT.
 */
export async function getNotificationPage(
  backerId: string,
  page = 0,
  size = 30,
) {
  const rows = await prisma.notification.findMany({
    where: { backerId },
    orderBy: { createdAt: "desc" },
    skip: Math.max(0, page) * size,
    take: size + 1,
  });
  return { rows: rows.slice(0, size), hasMore: rows.length > size };
}

// Rendered by both Nav and ConsumerShell on every signed-in page.
export const getUnreadCount = cache(async (backerId: string) => {
  return prisma.notification.count({ where: { backerId, read: false } });
});
