"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentBacker } from "@/lib/session";
import { isMutable } from "@/lib/notificationPrefs";
import type { NotificationType } from "@prisma/client";

/**
 * Turn one notification type on or off (docs/PRELAUNCH.md #28).
 *
 * A row means "off", so enabling deletes rather than writes `true` — see the
 * model comment for why absence is the default.
 */
export async function setNotificationPrefAction(
  type: NotificationType,
  enabled: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const backer = await getCurrentBacker();
  if (!backer) return { ok: false, error: "login" };
  // The mandatory types are not rendered with a control, but the action is a
  // public endpoint and has to refuse them itself — otherwise a crafted call
  // could mute the notice that mochi was refunded.
  if (!isMutable(type)) return { ok: false, error: "notMutable" };

  if (enabled) {
    await prisma.notificationPref.deleteMany({
      where: { backerId: backer.id, type },
    });
  } else {
    await prisma.notificationPref.upsert({
      where: { backerId_type: { backerId: backer.id, type } },
      create: { backerId: backer.id, type },
      update: {},
    });
  }

  revalidatePath("/settings");
  return { ok: true };
}
