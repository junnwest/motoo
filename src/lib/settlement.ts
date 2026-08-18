import { prisma } from "@/lib/db";

/**
 * What a creator has actually received (docs/PRELAUNCH.md #29).
 *
 * The Studio had no money view at all — a creator could see how many mochi they
 * had granted and nothing about the KRW that produced it, which is the only
 * number they care about at tax time.
 *
 * Two honesty problems this has to handle rather than paper over:
 *
 * 1. **Settlement timing needs the PG.** Donations reach the creator through the
 *    payment provider directly (motoo holds nothing and takes 0%), so when the
 *    money lands is the PG's schedule, not something motoo knows while
 *    PAYMENT_PROVIDER is `mock`. This reports *what was donated*, and the page
 *    says that is not the same as what has been paid out.
 *
 * 2. **The ledger starts on 2026-08-18.** Donations were only summed into
 *    MochiHolding before that (see the Donation model). So the per-period
 *    figures below can only cover the ledger era, and the difference against
 *    the lifetime totals is surfaced as its own line rather than quietly
 *    dropped — a settlement view that under-reports without saying so is worse
 *    than one that admits its horizon.
 */

export type SettlementSummary = {
  /** Sum of every donation row, refunds excluded. */
  ledgerGrossKrw: number;
  refundedKrw: number;
  netKrw: number;
  thisMonthKrw: number;
  lastMonthKrw: number;
  donationCount: number;
  /**
   * Lifetime KRW from the running totals, which predate the ledger. When this
   * exceeds `ledgerGrossKrw` the difference is donations from before the ledger
   * existed, and the page shows it as such.
   */
  lifetimeKrw: number;
  preLedgerKrw: number;
  recent: {
    id: string;
    amountKrw: number;
    mochiGranted: number;
    createdAt: Date;
    refunded: boolean;
    supporter: string;
  }[];
};

/** KST month boundaries. Settlement is read by people in Korea; UTC months would
 * put a donation made late on the 1st into the previous month for them. */
function kstMonthStart(monthsAgo: number): Date {
  const nowKst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const start = Date.UTC(
    nowKst.getUTCFullYear(),
    nowKst.getUTCMonth() - monthsAgo,
    1,
  );
  return new Date(start - 9 * 60 * 60 * 1000);
}

export async function getSettlementSummary(
  streamerId: string,
): Promise<SettlementSummary> {
  const thisMonth = kstMonthStart(0);
  const lastMonth = kstMonthStart(1);

  const [gross, refunded, thisM, lastM, lifetime, recent] = await Promise.all([
    prisma.donation.aggregate({
      where: { streamerId, refundedAt: null },
      _sum: { amountKrw: true },
      _count: { _all: true },
    }),
    prisma.donation.aggregate({
      where: { streamerId, refundedAt: { not: null } },
      _sum: { amountKrw: true },
    }),
    prisma.donation.aggregate({
      where: { streamerId, refundedAt: null, createdAt: { gte: thisMonth } },
      _sum: { amountKrw: true },
    }),
    prisma.donation.aggregate({
      where: {
        streamerId,
        refundedAt: null,
        createdAt: { gte: lastMonth, lt: thisMonth },
      },
      _sum: { amountKrw: true },
    }),
    prisma.mochiHolding.aggregate({
      where: { streamerId },
      _sum: { krwPaidTotal: true },
    }),
    prisma.donation.findMany({
      where: { streamerId },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        amountKrw: true,
        mochiGranted: true,
        createdAt: true,
        refundedAt: true,
        backer: { select: { nickname: true } },
      },
    }),
  ]);

  const ledgerGrossKrw = gross._sum.amountKrw ?? 0;
  const refundedKrw = refunded._sum.amountKrw ?? 0;
  const lifetimeKrw = lifetime._sum.krwPaidTotal ?? 0;

  return {
    ledgerGrossKrw,
    refundedKrw,
    netKrw: ledgerGrossKrw,
    thisMonthKrw: thisM._sum.amountKrw ?? 0,
    lastMonthKrw: lastM._sum.amountKrw ?? 0,
    donationCount: gross._count._all,
    lifetimeKrw,
    // Never negative: a completed refund decrements krwPaidTotal, so the
    // running total can dip below the ledger's gross rather than above it.
    preLedgerKrw: Math.max(0, lifetimeKrw - ledgerGrossKrw),
    recent: recent.map((d) => ({
      id: d.id,
      amountKrw: d.amountKrw,
      mochiGranted: d.mochiGranted,
      createdAt: d.createdAt,
      refunded: !!d.refundedAt,
      supporter: d.backer.nickname,
    })),
  };
}
