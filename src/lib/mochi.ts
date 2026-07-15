import { Prisma } from "@prisma/client";
import { prisma } from "./db";
import { getPaymentProvider } from "./payments";

/**
 * Phase 2 — mochi-marketplace core.
 *
 * A creator issues their own mochi (prepaid marketplace credit) at a per-mochi
 * KRW rate, capped as a SOFT GOAL (see docs/DECISIONS.md). Users buy mochi into a
 * per-creator holding and spend it on that creator's marketplace items.
 *
 * Invariants:
 *   - Mochi is integer units; KRW is integer (never floats).
 *   - Mochi is scoped to its issuing creator (a MochiHolding is per (creator, user))
 *     and is non-transferable.
 *   - A holding's balance never goes negative: a redemption checks balance inside
 *     the transaction before debiting.
 *   - Cancelling an order refunds the exact mochi spent and frees the stock.
 *
 * NOT a financial product: the goal is a creator-side target, never sold as a
 * "raise". Banned-vocabulary check (pnpm check:vocab) guards user-facing copy.
 */

export interface BuyMochiInput {
  backerId: string;
  streamerId: string;
  /** number of mochi units to buy (must be a positive integer) */
  quantity: number;
  /**
   * Idempotency token for the PG charge — generated once per user-initiated
   * purchase (client-side) so a network retry of the same click reuses it and
   * never double-charges. A stable per-purchase fallback is derived when absent.
   */
  idempotencyKey?: string;
}

export interface BuyMochiResult {
  balance: number;
  purchasedTotal: number;
  amountKrw: number;
}

/**
 * Buy `quantity` mochi from a creator. Charges KRW via the PaymentProvider (mock
 * in dev), credits a per-creator holding, and advances the soft-goal progress.
 */
export async function buyMochi(input: BuyMochiInput): Promise<BuyMochiResult> {
  const quantity = Math.trunc(input.quantity);
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new Error("INVALID_QUANTITY");
  }

  const issuance = await prisma.mochiIssuance.findUnique({
    where: { streamerId: input.streamerId },
  });
  if (!issuance || !issuance.active) throw new Error("MOCHI_NOT_ON_SALE");

  const amountKrw = issuance.pricePerMochiKrw * quantity; // integer KRW

  // Idempotency: prefer the caller's per-purchase token; otherwise derive a
  // stable one (NO wall-clock, so a retry of the same purchase can't slip past
  // a PG's idempotency guard and double-charge).
  const idempotencyKey =
    input.idempotencyKey ??
    `mochi_${input.backerId}_${input.streamerId}_${quantity}_${amountKrw}`;

  // Charge the buyer via the PG (real charge in prod; simulated in mock).
  const charge = await getPaymentProvider().purchaseMochi({
    backerId: input.backerId,
    streamerId: input.streamerId,
    quantity,
    amountKrw,
    idempotencyKey,
  });
  if (!charge.ok) throw new Error(charge.error ?? "CHARGE_FAILED");

  // Persist the credit. If this fails after a successful charge, COMPENSATE by
  // voiding the charge — never leave the buyer charged with no mochi credited.
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
          balance: charge.mochiGranted,
          purchasedTotal: charge.mochiGranted,
          krwPaidTotal: amountKrw,
        },
        update: {
          balance: { increment: charge.mochiGranted },
          purchasedTotal: { increment: charge.mochiGranted },
          // Lifetime KRW paid — the basis for a future refund-at-paid flow.
          krwPaidTotal: { increment: amountKrw },
        },
      });

      // Advance the current tier's meter (soft goal — buying past it is allowed)
      // and the lifetime total (which survives price-raise tier resets).
      await tx.mochiIssuance.update({
        where: { streamerId: input.streamerId },
        data: {
          soldQuantity: { increment: charge.mochiGranted },
          lifetimeSold: { increment: charge.mochiGranted },
        },
      });

      return holding;
    });
  } catch (e) {
    await getPaymentProvider()
      .voidCharge({ idempotencyKey, amountKrw })
      .catch(() => {
        // Best-effort void; a real adapter would enqueue a reconciliation job.
      });
    throw e;
  }

  // Route KRW to the creator's sub-merchant (motoo never holds funds, §8).
  const streamer = await prisma.streamer.findUnique({
    where: { id: input.streamerId },
    select: { subMerchantId: true },
  });
  if (streamer?.subMerchantId) {
    await getPaymentProvider().settleToStreamer({
      streamerSubMerchantId: streamer.subMerchantId,
      amountKrw,
      backingRef: idempotencyKey,
    });
  }

  return {
    balance: result.balance,
    purchasedTotal: result.purchasedTotal,
    amountKrw,
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

    const order = await tx.order.create({
      data: {
        streamerId: item.streamerId,
        backerId: input.backerId,
        itemId: item.id,
        mochiSpent,
        quantity,
        note: input.note ?? null,
        status: "pending",
      },
    });

    return {
      orderId: order.id,
      mochiSpent,
      balance: holding?.balance ?? 0,
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
 * Creator cancels a pending order: refunds the exact mochi to the buyer's holding
 * and frees the item's stock. Unspent mochi is always refundable (DECISIONS).
 */
export async function cancelOrder(orderId: string, byStreamerId: string) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order || order.streamerId !== byStreamerId) throw new Error("NOT_FOUND");
    if (order.status !== "pending") throw new Error("NOT_PENDING");

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

    return tx.order.update({
      where: { id: orderId },
      data: { status: "cancelled" },
    });
  });
}

/** A user's unspent mochi balance for one creator (0 if they hold none). */
export async function getHolding(streamerId: string, backerId: string) {
  const holding = await prisma.mochiHolding.findUnique({
    where: { streamerId_backerId: { streamerId, backerId } },
  });
  return holding ?? null;
}

/** All of a user's holdings across creators, for the "My mochi" view. */
export async function getHoldingsForBacker(backerId: string) {
  return prisma.mochiHolding.findMany({
    where: { backerId, balance: { gt: 0 } },
    include: { streamer: true },
    orderBy: { updatedAt: "desc" },
  });
}

/** A user's order/redemption history across creators, newest first. */
export async function getOrdersForBacker(backerId: string) {
  return prisma.order.findMany({
    where: { backerId },
    orderBy: { createdAt: "desc" },
    include: {
      item: { select: { title: true } },
      streamer: { select: { handle: true, displayName: true, avatarUrl: true } },
    },
  });
}

export { Prisma };
