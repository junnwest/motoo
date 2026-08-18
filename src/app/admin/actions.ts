"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getAdmin } from "@/lib/admin";
import { reportWarning } from "@/lib/report";

/**
 * Creator moderation. Two actions, both audited on the row itself.
 *
 * Suspension stops **new money** reaching a creator — `donateMochi` refuses
 * anything but `approved`, and the profile/explore queries stop finding them.
 * It deliberately does not touch existing balances: fans keep whatever mochi
 * they already earned and can still spend it, because stranding a fan's balance
 * behind a creator's misconduct punishes the wrong person.
 */

const suspendSchema = z.object({
  streamerId: z.string().min(1),
  // Required, and stored. An unexplained suspension is indistinguishable from
  // a bug — to the creator asking, and to whoever inherits this later.
  reason: z.string().min(3).max(500),
});

export async function suspendCreatorAction(
  input: z.infer<typeof suspendSchema>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = await getAdmin();
  if (!admin) return { ok: false, error: "forbidden" };

  const parsed = suspendSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "reasonRequired" };

  const streamer = await prisma.streamer.findUnique({
    where: { id: parsed.data.streamerId },
    select: { handle: true, status: true },
  });
  if (!streamer) return { ok: false, error: "notFound" };

  await prisma.streamer.update({
    where: { id: parsed.data.streamerId },
    data: {
      status: "suspended",
      suspendedAt: new Date(),
      suspendedReason: parsed.data.reason,
      suspendedBy: admin.email,
    },
  });

  // Not an error, but the single most consequential thing an operator can do
  // here, so it goes to the same place errors do rather than only into a
  // database column nobody tails.
  reportWarning(new Error("creator suspended"), {
    scope: "admin.suspendCreator",
    meta: {
      handle: streamer.handle,
      by: admin.email,
      reason: parsed.data.reason,
    },
  });

  revalidatePath("/admin");
  revalidatePath(`/s/${streamer.handle}`);
  revalidatePath("/explore");
  return { ok: true };
}

const restoreSchema = z.object({ streamerId: z.string().min(1) });

export async function restoreCreatorAction(
  input: z.infer<typeof restoreSchema>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = await getAdmin();
  if (!admin) return { ok: false, error: "forbidden" };

  const parsed = restoreSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "notFound" };

  const streamer = await prisma.streamer.findUnique({
    where: { id: parsed.data.streamerId },
    select: { handle: true },
  });
  if (!streamer) return { ok: false, error: "notFound" };

  await prisma.streamer.update({
    where: { id: parsed.data.streamerId },
    data: {
      status: "approved",
      // Cleared, not kept: the fields describe a *current* suspension. The
      // history of one lives in the report log, which is append-only.
      suspendedAt: null,
      suspendedReason: null,
      suspendedBy: null,
    },
  });

  reportWarning(new Error("creator restored"), {
    scope: "admin.restoreCreator",
    meta: { handle: streamer.handle, by: admin.email },
  });

  revalidatePath("/admin");
  revalidatePath(`/s/${streamer.handle}`);
  revalidatePath("/explore");
  return { ok: true };
}

const hideSchema = z.object({
  itemId: z.string().min(1),
  reason: z.string().min(3).max(500),
});

/**
 * Take down a single marketplace item.
 *
 * Suspending the whole creator was previously the only lever, which is a
 * sledgehammer when one item is the problem — and it punishes every fan holding
 * that creator's mochi for one bad listing. This is the proportionate response
 * the report queue needed: reports point at items, so acting on one should too.
 *
 * Written to `hiddenAt`, not `active`: `active` belongs to the creator, and a
 * takedown they can undo from their own Studio is not a takedown.
 */
export async function hideItemAction(
  input: z.infer<typeof hideSchema>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = await getAdmin();
  if (!admin) return { ok: false, error: "forbidden" };

  const parsed = hideSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "reasonRequired" };

  const item = await prisma.marketplaceItem.findUnique({
    where: { id: parsed.data.itemId },
    select: { title: true, streamer: { select: { handle: true } } },
  });
  if (!item) return { ok: false, error: "notFound" };

  await prisma.marketplaceItem.update({
    where: { id: parsed.data.itemId },
    data: {
      hiddenAt: new Date(),
      hiddenBy: admin.email,
      hiddenReason: parsed.data.reason,
    },
  });

  reportWarning(new Error("item hidden"), {
    scope: "admin.hideItem",
    meta: {
      itemId: parsed.data.itemId,
      title: item.title,
      by: admin.email,
      reason: parsed.data.reason,
    },
  });

  revalidatePath("/admin");
  revalidatePath(`/s/${item.streamer.handle}`);
  return { ok: true };
}

const unhideSchema = z.object({ itemId: z.string().min(1) });

export async function unhideItemAction(
  input: z.infer<typeof unhideSchema>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = await getAdmin();
  if (!admin) return { ok: false, error: "forbidden" };

  const parsed = unhideSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "notFound" };

  const item = await prisma.marketplaceItem.findUnique({
    where: { id: parsed.data.itemId },
    select: { streamer: { select: { handle: true } } },
  });
  if (!item) return { ok: false, error: "notFound" };

  await prisma.marketplaceItem.update({
    where: { id: parsed.data.itemId },
    data: { hiddenAt: null, hiddenBy: null, hiddenReason: null },
  });

  reportWarning(new Error("item restored"), {
    scope: "admin.unhideItem",
    meta: { itemId: parsed.data.itemId, by: admin.email },
  });

  revalidatePath("/admin");
  revalidatePath(`/s/${item.streamer.handle}`);
  return { ok: true };
}
