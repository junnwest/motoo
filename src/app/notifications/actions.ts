"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentBacker } from "@/lib/session";

export async function markAllRead(): Promise<{ ok: boolean }> {
  const backer = await getCurrentBacker();
  if (!backer) return { ok: false };
  await prisma.notification.updateMany({
    where: { backerId: backer.id, read: false },
    data: { read: true },
  });
  revalidatePath("/notifications");
  revalidatePath("/home");
  return { ok: true };
}

/** Marks one notification read (e.g. on click-through) — ownership-checked. */
export async function markRead(id: string): Promise<{ ok: boolean }> {
  const backer = await getCurrentBacker();
  if (!backer) return { ok: false };
  const result = await prisma.notification.updateMany({
    where: { id, backerId: backer.id },
    data: { read: true },
  });
  if (result.count === 0) return { ok: false };
  revalidatePath("/notifications");
  revalidatePath("/home");
  return { ok: true };
}
