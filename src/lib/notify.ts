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
  const unique = [...new Set(backerIds)];
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
  return [...holders, ...followers].map((r) => r.backerId);
}

/** Just the holders — used for money-adjacent notices like a price raise. */
export async function getHolderBackerIds(streamerId: string): Promise<string[]> {
  const holders = await prisma.mochiHolding.findMany({
    where: { streamerId },
    select: { backerId: true },
  });
  return holders.map((r) => r.backerId);
}

export async function getNotificationsForBacker(backerId: string, take = 30) {
  return prisma.notification.findMany({
    where: { backerId },
    orderBy: { createdAt: "desc" },
    take,
  });
}

// Rendered by both Nav and ConsumerShell on every signed-in page.
export const getUnreadCount = cache(async (backerId: string) => {
  return prisma.notification.count({ where: { backerId, read: false } });
});
