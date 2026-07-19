"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getCurrentBacker } from "@/lib/session";
import { buyMochi, redeemItem } from "@/lib/mochi";

/**
 * User-side buy/spend server actions for the mochi marketplace.
 * Return shape is always { ok:true, ... } | { ok:false, error:string }, where
 * `error` is an i18n key suffix under the "marketplace.errors" namespace.
 */

const buySchema = z.object({
  handle: z.string(),
  streamerId: z.string(),
  quantity: z.number().int().positive(),
  // Per-purchase idempotency token from the client (a retried click reuses it).
  idempotencyKey: z.string().min(1).max(200).optional(),
});

export type BuyMochiActionResult =
  | { ok: true; balance: number; amountKrw: number }
  | { ok: false; error: string };

export async function buyMochiAction(
  input: z.infer<typeof buySchema>,
): Promise<BuyMochiActionResult> {
  const parsed = buySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "generic" };
  const data = parsed.data;

  const backer = await getCurrentBacker();
  if (!backer) return { ok: false, error: "login" };

  try {
    const { balance, amountKrw } = await buyMochi({
      backerId: backer.id,
      streamerId: data.streamerId,
      quantity: data.quantity,
      idempotencyKey: data.idempotencyKey,
    });
    revalidatePath(`/s/${data.handle}`);
    return { ok: true, balance, amountKrw };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "MOCHI_NOT_ON_SALE") return { ok: false, error: "notOnSale" };
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
    return { ok: true, balance, mochiSpent, instant };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "OUT_OF_STOCK") return { ok: false, error: "outOfStock" };
    if (msg === "INSUFFICIENT_MOCHI") return { ok: false, error: "insufficient" };
    return { ok: false, error: "generic" };
  }
}
