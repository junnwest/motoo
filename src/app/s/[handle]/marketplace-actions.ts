"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getCurrentBacker } from "@/lib/session";
import {
  donateMochi,
  redeemItem,
  cancelOrderByBuyer,
  getHolding,
} from "@/lib/mochi";
import { MOCHI_MAX_PURCHASE_KRW } from "@/lib/issuance";
import { checkRateLimit } from "@/lib/rateLimit";
import { reportError } from "@/lib/report";

/**
 * User-side donate/spend server actions for the mochi marketplace.
 * Return shape is always { ok:true, ... } | { ok:false, error:string }, where
 * `error` is an i18n key suffix under the "donate.errors" / "marketplace.errors"
 * namespace respectively.
 *
 * Donating is gated (verification + age + per-donation ceilings, all enforced
 * in `donateMochi`). **Redeeming deliberately is not** — spending mochi you
 * already hold is not a new payment, so it doesn't re-run the payment
 * eligibility rules. The money moved, and was gated, at donation time.
 */

const donateSchema = z.object({
  handle: z.string(),
  streamerId: z.string(),
  // Bounded at the edge as well as in donateMochi. `.max()` here gives the
  // client a specific error; donateMochi re-checks because it, not this schema,
  // is the money surface under test.
  donationAmountKrw: z.number().int().positive().max(MOCHI_MAX_PURCHASE_KRW),
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
  if (!parsed.success) {
    // The only bound a well-formed client can trip is the KRW ceiling, so name
    // it rather than falling through to the generic message.
    const tooMuch =
      typeof input?.donationAmountKrw === "number" &&
      input.donationAmountKrw > MOCHI_MAX_PURCHASE_KRW;
    return { ok: false, error: tooMuch ? "amountMax" : "generic" };
  }
  const data = parsed.data;

  const backer = await getCurrentBacker();
  if (!backer) return { ok: false, error: "login" };
  // A ceiling per donation is not a ceiling per minute.
  if (!(await checkRateLimit("buy", backer.id))) {
    return { ok: false, error: "tooMany" };
  }

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
    if (msg === "BLOCKED_BY_CREATOR")
      return { ok: false, error: "blockedByCreator" };
    if (msg === "CREATOR_UNAVAILABLE")
      return { ok: false, error: "creatorUnavailable" };
    if (msg === "MOCHI_BONUS_PAUSED")
      return { ok: false, error: "donationClosed" };
    if (msg === "DONATION_BELOW_MIN") return { ok: false, error: "belowMin" };
    if (msg === "QUANTITY_TOO_LARGE") return { ok: false, error: "quantityMax" };
    if (msg === "AMOUNT_TOO_LARGE") return { ok: false, error: "amountMax" };
    if (msg === "NOT_VERIFIED") return { ok: false, error: "verifyRequired" };
    if (msg === "GUARDIAN_CONSENT_REQUIRED") {
      return { ok: false, error: "guardianRequired" };
    }
    // Everything above is a rule the product is enforcing on purpose, and the
    // user gets told which. Reaching here means something else broke, and
    // "generic" is all the user should see — but it is not all *we* should
    // know, which is what this line is for.
    reportError(e, {
      scope: "donateMochiAction",
      meta: {
        backerId: backer.id,
        streamerId: data.streamerId,
        amountKrw: data.donationAmountKrw,
      },
    });
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
  if (!(await checkRateLimit("redeem", backer.id))) {
    return { ok: false, error: "tooMany" };
  }

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
    reportError(e, {
      scope: "redeemItemAction",
      meta: { backerId: backer.id, itemId: data.itemId },
    });
    return { ok: false, error: "generic" };
  }
}

const cancelSchema = z.object({ orderId: z.string().min(1) });

export type CancelOrderActionResult =
  | { ok: true; balance: number }
  | { ok: false; error: string };

/**
 * Buyer cancels their own pending order and gets the mochi back.
 *
 * Ownership is enforced inside `cancelOrderByBuyer` against the session's
 * backer id — the client supplies only an order id and is never trusted to say
 * whose it is, matching how the Studio actions treat streamerId.
 */
export async function cancelOrderAction(
  input: z.infer<typeof cancelSchema>,
): Promise<CancelOrderActionResult> {
  const parsed = cancelSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "generic" };

  const backer = await getCurrentBacker();
  if (!backer) return { ok: false, error: "login" };

  try {
    const order = await cancelOrderByBuyer(parsed.data.orderId, backer.id);
    const holding = await getHolding(order.streamerId, backer.id);
    revalidatePath("/profile");
    revalidatePath("/home");
    return { ok: true, balance: holding?.balance ?? 0 };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    // NOT_PENDING covers both "already fulfilled" and "someone cancelled it a
    // moment ago" — from the buyer's side those read the same: it's too late.
    if (msg === "NOT_PENDING") return { ok: false, error: "notPending" };
    // NOT_FOUND is also expected: it is what an order belonging to someone else
    // looks like, and the ownership check is supposed to produce it.
    if (msg === "NOT_FOUND") return { ok: false, error: "generic" };
    reportError(e, {
      scope: "cancelOrderAction",
      meta: { backerId: backer.id, orderId: parsed.data.orderId },
    });
    return { ok: false, error: "generic" };
  }
}
