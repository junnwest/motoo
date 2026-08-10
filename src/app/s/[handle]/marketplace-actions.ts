"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getCurrentBacker } from "@/lib/session";
import { donateMochi, redeemItem } from "@/lib/mochi";

/**
 * User-side donate/spend server actions for the mochi marketplace.
 * Return shape is always { ok:true, ... } | { ok:false, error:string }, where
 * `error` is an i18n key suffix under the "donate.errors" / "marketplace.errors"
 * namespace respectively.
 */

const donateSchema = z.object({
  handle: z.string(),
  streamerId: z.string(),
  donationAmountKrw: z.number().int().positive(),
  // Per-donation idempotency token from the client (a retried click reuses it).
  idempotencyKey: z.string().min(1).max(200).optional(),
});

export type DonateMochiActionResult =
  | { ok: true; balance: number; mochiGranted: number; amountKrw: number }
  | { ok: false; error: string };

export async function donateMochiAction(
  input: z.infer<typeof donateSchema>,
): Promise<DonateMochiActionResult> {
  const parsed = donateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "generic" };
  const data = parsed.data;

  const backer = await getCurrentBacker();
  if (!backer) return { ok: false, error: "login" };

  try {
    const { balance, mochiGranted, amountKrw } = await donateMochi({
      backerId: backer.id,
      streamerId: data.streamerId,
      donationAmountKrw: data.donationAmountKrw,
      idempotencyKey: data.idempotencyKey,
    });
    revalidatePath(`/s/${data.handle}`);
    revalidatePath(`/s/${data.handle}/donate`);
    return { ok: true, balance, mochiGranted, amountKrw };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "MOCHI_BONUS_PAUSED")
      return { ok: false, error: "donationClosed" };
    if (msg === "DONATION_BELOW_MIN") return { ok: false, error: "belowMin" };
    return { ok: false, error: "generic" };
  }
}

const redeemSchema = z.object({
  handle: z.string(),
  itemId: z.string(),
  note: z.string().max(500).optional().nullable(),
});

export type RedeemItemActionResult =
  | { ok: true; balance: number; mochiSpent: number; instant: boolean }
  | { ok: false; error: string };

export async function redeemItemAction(
  input: z.infer<typeof redeemSchema>,
): Promise<RedeemItemActionResult> {
  const parsed = redeemSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "generic" };
  const data = parsed.data;

  const backer = await getCurrentBacker();
  if (!backer) return { ok: false, error: "login" };

  try {
    const { balance, mochiSpent, instant } = await redeemItem({
      backerId: backer.id,
      itemId: data.itemId,
      note: data.note ?? null,
    });
    revalidatePath(`/s/${data.handle}`);
    revalidatePath(`/s/${data.handle}/donate`);
    return { ok: true, balance, mochiSpent, instant };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "OUT_OF_STOCK") return { ok: false, error: "outOfStock" };
    if (msg === "INSUFFICIENT_MOCHI") return { ok: false, error: "insufficient" };
    return { ok: false, error: "generic" };
  }
}
