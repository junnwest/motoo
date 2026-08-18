import type { NotificationType } from "@prisma/client";
import { prisma } from "@/lib/db";

/**
 * Which notifications a person can turn off (docs/PRELAUNCH.md #28).
 *
 * Every type was on with no way to change it. The split here is not "all of
 * them, because choice is good" — it is between notices about *the reader's own
 * transaction* and notices about *a creator's activity*:
 *
 *   - `order_fulfilled` / `order_cancelled` describe what happened to an order
 *     they placed, and `order_cancelled` specifically means mochi went back to
 *     their balance. Letting someone mute that would mean money moving in their
 *     account with no record they were told. These stay mandatory, and the
 *     settings page says so rather than hiding them.
 *   - `new_item`, `new_update` and `price_raised` are a creator doing
 *     something. `price_raised` is here rather than with the order notices
 *     because it changes what a *future* donation earns and touches nothing
 *     already held — worth knowing, not owed.
 *
 * There is one channel (in-app), so there is no channel choice to offer yet;
 * that arrives with notification email, and this is the table it will hang off.
 */
export const MUTABLE_NOTIFICATIONS = [
  "new_item",
  "new_update",
  "price_raised",
] as const satisfies readonly NotificationType[];

export type MutableNotification = (typeof MUTABLE_NOTIFICATIONS)[number];

export function isMutable(type: NotificationType): type is MutableNotification {
  return (MUTABLE_NOTIFICATIONS as readonly string[]).includes(type);
}

/**
 * Drop the recipients who have turned this type off.
 *
 * Absence of a row means enabled, so a type nobody has ever opted out of costs
 * one indexed lookup that returns nothing — and a newly added NotificationType
 * is on for everyone rather than silently off for every account that saved
 * preferences before it existed.
 */
export async function filterByPreference(
  backerIds: string[],
  type: NotificationType,
): Promise<string[]> {
  if (backerIds.length === 0 || !isMutable(type)) return backerIds;

  const off = await prisma.notificationPref.findMany({
    where: { type, backerId: { in: backerIds } },
    select: { backerId: true },
  });
  if (off.length === 0) return backerIds;
  const drop = new Set(off.map((r) => r.backerId));
  return backerIds.filter((id) => !drop.has(id));
}

/** The current settings for one account: every mutable type, on or off. */
export async function getNotificationPrefs(
  backerId: string,
): Promise<Record<MutableNotification, boolean>> {
  const off = await prisma.notificationPref.findMany({
    where: { backerId },
    select: { type: true },
  });
  const disabled = new Set(off.map((r) => r.type as string));
  return Object.fromEntries(
    MUTABLE_NOTIFICATIONS.map((t) => [t, !disabled.has(t)]),
  ) as Record<MutableNotification, boolean>;
}
