import { Prisma, type BackingDisplay } from "@prisma/client";
import { prisma } from "./db";
import { getPaymentProvider } from "./payments";
import { MOCHI_TO_KRW } from "./payments/types";

export interface CreateBackingInput {
  backerId: string;
  streamerId: string;
  tierId: string;
  display: BackingDisplay;
  displayName?: string | null;
  message?: string | null;
}

export interface CreateBackingResult {
  foundingNumber: number;
  backingId: string;
  newBalance: number;
}

/**
 * Return the founding number a backer will receive for a streamer WITHOUT
 * assigning one. Used to show the number before payment (spec §5). If the backer
 * already has a membership, that (permanent) number is returned.
 */
export async function previewFoundingNumber(
  streamerId: string,
  backerId: string | null,
): Promise<{ number: number; existing: boolean }> {
  if (backerId) {
    const existing = await prisma.foundingMembership.findUnique({
      where: { streamerId_backerId: { streamerId, backerId } },
    });
    if (existing) return { number: existing.foundingNumber, existing: true };
  }
  const max = await prisma.foundingMembership.aggregate({
    where: { streamerId },
    _max: { foundingNumber: true },
  });
  return { number: (max._max.foundingNumber ?? 0) + 1, existing: false };
}

/**
 * Record a backing. Enforces the founding-number invariant: assigned once per
 * (streamer, backer), never reused/reordered. Mochi is spent (integer units),
 * KRW is settled to the streamer's sub-merchant via the PaymentProvider.
 */
export async function createBacking(
  input: CreateBackingInput,
): Promise<CreateBackingResult> {
  const tier = await prisma.tier.findUnique({ where: { id: input.tierId } });
  if (!tier || !tier.active || tier.streamerId !== input.streamerId) {
    throw new Error("INVALID_TIER");
  }
  const mochiCost = Math.round(tier.priceKrw / MOCHI_TO_KRW);

  const result = await prisma.$transaction(async (tx) => {
    const backer = await tx.backer.findUnique({ where: { id: input.backerId } });
    if (!backer) throw new Error("NO_BACKER");
    if (backer.currencyBalance < mochiCost) throw new Error("INSUFFICIENT_MOCHI");

    // Assign or reuse the founding number.
    let membership = await tx.foundingMembership.findUnique({
      where: {
        streamerId_backerId: {
          streamerId: input.streamerId,
          backerId: input.backerId,
        },
      },
    });
    if (!membership) {
      const max = await tx.foundingMembership.aggregate({
        where: { streamerId: input.streamerId },
        _max: { foundingNumber: true },
      });
      membership = await tx.foundingMembership.create({
        data: {
          streamerId: input.streamerId,
          backerId: input.backerId,
          foundingNumber: (max._max.foundingNumber ?? 0) + 1,
        },
      });
    }

    const backing = await tx.backing.create({
      data: {
        streamerId: input.streamerId,
        backerId: input.backerId,
        tierId: input.tierId,
        amountKrw: tier.priceKrw,
        currencyUnitsSpent: mochiCost,
        foundingNumber: membership.foundingNumber,
        display: input.display,
        displayName: input.displayName ?? null,
        message: input.message ?? null,
        status: "paid",
      },
    });

    const updatedBacker = await tx.backer.update({
      where: { id: input.backerId },
      data: { currencyBalance: { decrement: mochiCost } },
    });

    await tx.tier.update({
      where: { id: input.tierId },
      data: { backerCount: { increment: 1 } },
    });

    return {
      foundingNumber: membership.foundingNumber,
      backingId: backing.id,
      newBalance: updatedBacker.currencyBalance,
    };
  });

  // Settle KRW to the streamer sub-merchant (motoo never holds funds, §8).
  const streamer = await prisma.streamer.findUnique({
    where: { id: input.streamerId },
    select: { subMerchantId: true },
  });
  if (streamer?.subMerchantId) {
    await getPaymentProvider().settleToStreamer({
      streamerSubMerchantId: streamer.subMerchantId,
      amountKrw: tier.priceKrw,
      backingRef: result.backingId,
    });
  }

  return result;
}

/** Buy a cookie pack: charges via the PG (mock) and credits mochi. */
export async function purchaseCookies(
  backerId: string,
  packId: string,
): Promise<{ newBalance: number }> {
  const { COOKIE_PACKS } = await import("./payments/types");
  const pack = COOKIE_PACKS.find((p) => p.id === packId);
  if (!pack) throw new Error("INVALID_PACK");

  const idempotencyKey = `${backerId}_${packId}_${Date.now()}`;
  const res = await getPaymentProvider().purchaseCookies({
    backerId,
    pack,
    idempotencyKey,
  });
  if (!res.ok) throw new Error(res.error ?? "PURCHASE_FAILED");

  const updated = await prisma.backer.update({
    where: { id: backerId },
    data: { currencyBalance: { increment: res.mochiGranted } },
  });
  return { newBalance: updated.currencyBalance };
}

export { Prisma };
