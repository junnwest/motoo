import { cache } from "react";
import { Prisma, type OrderStatus } from "@prisma/client";
import { prisma } from "./db";
import { getPaymentProvider } from "./payments";
import { validatePurchase } from "./issuance";

/**
 * Phase 3 — donation-bonus core.
 *
 * A fan donates KRW directly to a creator (100% of it, minus only the PG's own
 * unavoidable fee — motoo takes 0% cut). Mochi is never sold: it's granted
 * afterward as a non-purchased bonus, at a per-mochi rate the creator sets and
 * can only raise, capped as a SOFT GOAL (see docs/DECISIONS.md). Fans spend
 * earned mochi on that creator's marketplace items.
 *
 * Invariants:
 *   - Mochi is integer units; KRW is integer (never floats).
 *   - Mochi is scoped to its issuing creator (a MochiHolding is per (creator, user))
 *     and is non-transferable.
 *   - A holding's balance never goes negative: a redemption checks balance inside
 *     the transaction before debiting.
 *   - Cancelling an order refunds the exact mochi spent and frees the stock.
 *   - A purchase is bounded on BOTH ends: the issuance floors (src/lib/issuance.ts)
 *     bound what a creator may issue; MOCHI_MAX_PURCHASE_* bound what one fan may
 *     buy in a single transaction.
 *   - Only an identity-verified buyer can purchase, and a minor needs recorded
 *     guardian consent (see `assertCanPurchase`).
 *
 * NOT a financial product: the goal is a creator-side target, never sold as a
 * "raise". Banned-vocabulary check (pnpm check:vocab) guards user-facing copy.
 */

/**
 * Gate the donor before any money moves.
 *
 * Korea gates payments on 본인인증 through a 본인확인기관, not a self-reported
 * birthdate — `Backer.verifiedAt` / `ageVerified` are written server-side by a
 * VerificationProvider (src/lib/verification) and never by the client.
 *
 * This lives here, in the tested money surface, rather than only in the server
 * action. `/onboarding` already hard-requires `verifiedAt` before an account can
 * reach the app, so in practice every donor arriving through the UI is verified;
 * this closes the action-level path and makes the rule testable. The `/refund`
 * 법령 carve-out promises a minor's payment is refundable, and the product can't
 * honour a rule it never evaluates.
 *
 * A minor is not blocked outright — a minor **with recorded guardian consent**
 * may transact, which is what `guardianConsent` exists to record. The flow that
 * collects it is not built yet (see docs/PROGRESS.md), so today a minor is
 * always stopped here; that's the correct failure, not a placeholder.
 */
async function assertCanPurchase(backerId: string): Promise<void> {
  const backer = await prisma.backer.findUnique({
    where: { id: backerId },
    select: { verifiedAt: true, ageVerified: true, guardianConsent: true },
  });
  if (!backer) throw new Error("BACKER_NOT_FOUND");
  if (!backer.verifiedAt) throw new Error("NOT_VERIFIED");
  // Adults pass. A minor needs guardian consent explicitly recorded as true —
  // `null` (never asked) and `false` (asked, not granted) both stop here.
  if (!backer.ageVerified && backer.guardianConsent !== true) {
    throw new Error("GUARDIAN_CONSENT_REQUIRED");
  }
}

export interface DonateMochiInput {
  backerId: string;
  streamerId: string;
  /** integer KRW the fan chooses to donate (must be a positive integer) */
  donationAmountKrw: number;
  /**
   * Idempotency token for the PG charge — generated once per user-initiated
   * donation (client-side) so a network retry of the same click reuses it and
   * never double-charges. A stable per-donation fallback is derived when absent.
   */
  idempotencyKey?: string;
}

export interface DonateMochiResult {
  balance: number;
  mochiEarnedTotal: number;
  /** mochi earned by THIS donation — the caller can't infer it from its own
   * input (a donation amount, not a mochi count), so the server returns it. */
  mochiGranted: number;
  amountKrw: number;
}

/**
 * Donate `donationAmountKrw` to a creator. Charges the fan via the
 * PaymentProvider (mock in dev), computes the mochi bonus from the creator's
 * current rate, credits a per-creator holding, and advances the soft-goal
 * progress — then routes the FULL donation to the creator (motoo takes 0%).
 */
export async function donateMochi(
  input: DonateMochiInput,
): Promise<DonateMochiResult> {
  const donationAmountKrw = Math.trunc(input.donationAmountKrw);
  if (!Number.isInteger(donationAmountKrw) || donationAmountKrw <= 0) {
    throw new Error("INVALID_AMOUNT");
  }

  // Buyer eligibility before anything else — no lookup, no charge, no credit for
  // an unverified account or a minor without guardian consent.
  await assertCanPurchase(input.backerId);

  const issuance = await prisma.mochiIssuance.findUnique({
    where: { streamerId: input.streamerId },
  });
  if (!issuance || !issuance.active) throw new Error("MOCHI_BONUS_PAUSED");

  // A donation smaller than the current rate would earn 0 bonus mochi — reject
  // rather than silently accept it for a confusing 0-mochi "bonus."
  if (donationAmountKrw < issuance.pricePerMochiKrw) {
    throw new Error("DONATION_BELOW_MIN");
  }

  // motoo's own math, computed BEFORE charging, independent of the PG. Floor:
  // a fan never earns a fractional mochi; the remainder still goes 100% to the
  // creator (no mochi "change" owed — donation size never changes).
  const mochiGranted = Math.floor(
    donationAmountKrw / issuance.pricePerMochiKrw,
  );

  // Per-donation ceilings — server-authoritative, checked BEFORE the PG is
  // called so an over-limit request is never charged. The client caps its own
  // input too, but that's a courtesy; this is the enforcement. The bonus grant
  // is what the quantity ceiling binds, so it's checked after the floor above.
  const limitError = validatePurchase(mochiGranted, donationAmountKrw);
  if (limitError === "quantityMax") throw new Error("QUANTITY_TOO_LARGE");
  if (limitError === "amountMax") throw new Error("AMOUNT_TOO_LARGE");

  // Idempotency: prefer the caller's per-donation token; otherwise derive a
  // stable one (NO wall-clock, so a retry of the same donation can't slip past
  // a PG's idempotency guard and double-charge).
  const idempotencyKey =
    input.idempotencyKey ??
    `mochi_donate_${input.backerId}_${input.streamerId}_${donationAmountKrw}`;

  // Charge the fan via the PG (real charge in prod; simulated in mock). The PG
  // has no concept of mochi — it only ever sees a donation amount.
  const charge = await getPaymentProvider().donate({
    backerId: input.backerId,
    streamerId: input.streamerId,
    amountKrw: donationAmountKrw,
    idempotencyKey,
  });
  if (!charge.ok) throw new Error(charge.error ?? "CHARGE_FAILED");

  // Persist the bonus credit. If this fails after a successful charge,
  // COMPENSATE by voiding the charge — never leave the fan charged with no
  // mochi credited.
  let result;
  try {
    result = await prisma.$transaction(async (tx) => {
      const holding = await tx.mochiHolding.upsert({
        where: {
          streamerId_backerId: {
            streamerId: input.streamerId,
            backerId: input.backerId,
          },
        },
        create: {
          streamerId: input.streamerId,
          backerId: input.backerId,
          balance: mochiGranted,
          mochiEarnedTotal: mochiGranted,
          krwPaidTotal: donationAmountKrw,
        },
        update: {
          balance: { increment: mochiGranted },
          mochiEarnedTotal: { increment: mochiGranted },
          // Lifetime KRW donated — the leaderboard/refund ledger.
          krwPaidTotal: { increment: donationAmountKrw },
        },
      });

      // Advance the current tier's meter (soft goal — donating past it is
      // allowed) and the lifetime total (which survives rate-raise resets).
      await tx.mochiIssuance.update({
        where: { streamerId: input.streamerId },
        data: {
          grantedQuantity: { increment: mochiGranted },
          lifetimeGranted: { increment: mochiGranted },
        },
      });

      return holding;
    });
  } catch (e) {
    await getPaymentProvider()
      .voidCharge({ idempotencyKey, amountKrw: donationAmountKrw })
      .catch(() => {
        // Best-effort void; a real adapter would enqueue a reconciliation job.
      });
    throw e;
  }

  // Route the FULL donation to the creator's sub-merchant — motoo never holds
  // funds and takes 0% cut (§8).
  const streamer = await prisma.streamer.findUnique({
    where: { id: input.streamerId },
    select: { subMerchantId: true },
  });
  if (streamer?.subMerchantId) {
    await getPaymentProvider().settleToStreamer({
      streamerSubMerchantId: streamer.subMerchantId,
      amountKrw: donationAmountKrw,
      backingRef: idempotencyKey,
    });
  }

  return {
    balance: result.balance,
    mochiEarnedTotal: result.mochiEarnedTotal,
    mochiGranted,
    amountKrw: donationAmountKrw,
  };
}

export interface RedeemItemInput {
  backerId: string;
  itemId: string;
  quantity?: number;
  note?: string | null;
}

export interface RedeemItemResult {
  orderId: string;
  mochiSpent: number;
  balance: number;
  /** true when the item auto-completed (instant); false when it awaits the creator. */
  instant: boolean;
}

/**
 * Spend mochi on a marketplace item. Debits the buyer's per-creator holding,
 * decrements stock, and records a pending Order for off-platform fulfillment.
 */
export async function redeemItem(
  input: RedeemItemInput,
): Promise<RedeemItemResult> {
  const quantity = Math.trunc(input.quantity ?? 1);
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new Error("INVALID_QUANTITY");
  }

  return prisma.$transaction(async (tx) => {
    const item = await tx.marketplaceItem.findUnique({
      where: { id: input.itemId },
    });
    if (!item || !item.active) throw new Error("ITEM_UNAVAILABLE");

    const mochiSpent = item.priceMochi * quantity;

    // Stock guard — atomic. `stock` null = unlimited. A single conditional
    // UPDATE (row-locked) prevents overselling under concurrent redemptions;
    // an affected-row count of 0 means there wasn't room. Comparing two columns
    // isn't expressible in Prisma `where`, so this uses raw SQL.
    if (item.stock !== null) {
      const claimed = await tx.$executeRaw`
        UPDATE "MarketplaceItem"
        SET "redeemedCount" = "redeemedCount" + ${quantity}
        WHERE "id" = ${item.id}
          AND "redeemedCount" + ${quantity} <= "stock"`;
      if (claimed === 0) throw new Error("OUT_OF_STOCK");
    } else {
      await tx.marketplaceItem.update({
        where: { id: item.id },
        data: { redeemedCount: { increment: quantity } },
      });
    }

    // Balance debit — atomic. Only decrements when the holding still has enough
    // (guards against a negative balance from concurrent redemptions); a count
    // of 0 means no holding or insufficient funds. Rolls back the stock claim.
    const debited = await tx.mochiHolding.updateMany({
      where: {
        streamerId: item.streamerId,
        backerId: input.backerId,
        balance: { gte: mochiSpent },
      },
      data: { balance: { decrement: mochiSpent } },
    });
    if (debited.count === 0) throw new Error("INSUFFICIENT_MOCHI");

    const holding = await tx.mochiHolding.findUnique({
      where: {
        streamerId_backerId: {
          streamerId: item.streamerId,
          backerId: input.backerId,
        },
      },
      select: { balance: true },
    });

    // Instant items settle on redemption — the order is recorded already
    // fulfilled, so it never lands in the creator's pending queue (and, like any
    // fulfilled order, can't be cancelled/refunded afterward). Request items stay
    // pending for the creator to act on.
    const instant = item.fulfillment === "instant";
    const order = await tx.order.create({
      data: {
        streamerId: item.streamerId,
        backerId: input.backerId,
        itemId: item.id,
        mochiSpent,
        quantity,
        note: input.note ?? null,
        status: instant ? "fulfilled" : "pending",
        fulfilledAt: instant ? new Date() : null,
      },
    });

    return {
      orderId: order.id,
      mochiSpent,
      balance: holding?.balance ?? 0,
      instant,
    };
  });
}

/**
 * Creator marks an order fulfilled (fulfillment happens off-platform in v1).
 * Guarded by the owning creator so one creator can't touch another's orders.
 */
export async function fulfillOrder(orderId: string, byStreamerId: string) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order || order.streamerId !== byStreamerId) throw new Error("NOT_FOUND");
    if (order.status !== "pending") throw new Error("NOT_PENDING");
    return tx.order.update({
      where: { id: orderId },
      data: { status: "fulfilled", fulfilledAt: new Date() },
    });
  });
}

/**
 * Cancel a pending order: refund the exact mochi to the buyer's holding and
 * free the item's stock. Shared by the creator-side and buyer-side entry
 * points below, which differ only in who is allowed to do it.
 *
 * **The status transition is claimed atomically**, and that is the whole point
 * of this function's shape. The previous version read the order, checked
 * `status === "pending"`, and only then refunded — so two cancels racing (the
 * creator and the buyer both hitting cancel, or one double-click) could each
 * read `pending` and each credit the balance, refunding twice for one order.
 * A conditional UPDATE takes the row lock instead: the loser re-evaluates its
 * WHERE against the committed row, matches nothing, and backs out having moved
 * no money. Same guard `redeemItem` already uses for balance and stock.
 *
 * This mattered less when only the creator could cancel. Buyer-initiated
 * cancellation makes the race genuinely reachable, so it is closed here rather
 * than assumed away.
 */
async function cancelPendingOrder(
  orderId: string,
  authorize: (order: { streamerId: string; backerId: string }) => boolean,
) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order || !authorize(order)) throw new Error("NOT_FOUND");
    if (order.status !== "pending") throw new Error("NOT_PENDING");

    const claimed = await tx.order.updateMany({
      where: { id: orderId, status: "pending" },
      data: { status: "cancelled" },
    });
    if (claimed.count === 0) throw new Error("NOT_PENDING");

    await tx.mochiHolding.update({
      where: {
        streamerId_backerId: {
          streamerId: order.streamerId,
          backerId: order.backerId,
        },
      },
      data: { balance: { increment: order.mochiSpent } },
    });

    await tx.marketplaceItem.update({
      where: { id: order.itemId },
      data: { redeemedCount: { decrement: order.quantity } },
    });

    return tx.order.findUniqueOrThrow({ where: { id: orderId } });
  });
}

/**
 * Creator cancels a pending order. Unspent mochi is always refundable
 * (DECISIONS), and cancelling is how a creator declines a request.
 */
export async function cancelOrder(orderId: string, byStreamerId: string) {
  return cancelPendingOrder(orderId, (o) => o.streamerId === byStreamerId);
}

/**
 * **Buyer** cancels their own pending order.
 *
 * Until now cancellation was creator-only: a fan who redeemed the wrong item,
 * or changed their mind a second later, had no way to undo it and had to ask
 * the creator. Spending was the fastest, least reversible interaction in the
 * product. This is the exact mirror of the creator path — same transaction,
 * same refund, same stock release — differing only in the ownership check.
 *
 * Only `pending` orders qualify, which is what keeps this honest: an `instant`
 * item is recorded `fulfilled` at redemption (see `redeemItem`) and so can
 * never be cancelled, and a creator who has already fulfilled a request has
 * done the work.
 */
export async function cancelOrderByBuyer(orderId: string, byBackerId: string) {
  return cancelPendingOrder(orderId, (o) => o.backerId === byBackerId);
}

/** A user's unspent mochi balance for one creator (0 if they hold none). */
export async function getHolding(streamerId: string, backerId: string) {
  const holding = await prisma.mochiHolding.findUnique({
    where: { streamerId_backerId: { streamerId, backerId } },
  });
  return holding ?? null;
}

/**
 * All of a user's holdings across creators, for the "My mochi" view.
 * Cached per request: the RightRail and the page itself both read it.
 */
export const getHoldingsForBacker = cache(async (backerId: string) => {
  return prisma.mochiHolding.findMany({
    where: { backerId, balance: { gt: 0 } },
    include: { streamer: true },
    orderBy: { updatedAt: "desc" },
  });
});

/**
 * A user's order/redemption history across creators, newest first.
 *
 * Bounded. This used to fetch **every order the user had ever placed** on both
 * `/profile` and `/home` — and `/home` only wanted the pending ones, which it
 * then filtered in JavaScript. `status` pushes that filter into the query, and
 * `take` stops the history growing without limit behind a page that shows a
 * flat list.
 */
export async function getOrdersForBacker(
  backerId: string,
  opts: { status?: OrderStatus; take?: number } = {},
) {
  return prisma.order.findMany({
    where: { backerId, ...(opts.status ? { status: opts.status } : {}) },
    orderBy: { createdAt: "desc" },
    take: opts.take ?? 50,
    include: {
      item: { select: { title: true } },
      streamer: { select: { handle: true, displayName: true, avatarUrl: true } },
    },
  });
}

export { Prisma };
