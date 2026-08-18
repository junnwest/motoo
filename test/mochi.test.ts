/**
 * Integration tests for the mochi-marketplace money logic (src/lib/mochi.ts).
 *
 * Runs against the local Postgres (docker, `pnpm db:up`). Uses isolated fixtures
 * (a dedicated *.motoo.test creator + fan) that are created/reset per test and
 * torn down at the end, so it never touches seed data. Run: `pnpm test`.
 */
import { describe, it, before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "@/lib/db";
import {
  donateMochi,
  redeemItem,
  cancelOrder,
  cancelOrderByBuyer,
  getHolding,
} from "@/lib/mochi";
import { checkRefundEligibility } from "@/lib/refunds";
import { getSupporterLeaderboard } from "@/lib/ranking";
import {
  MOCHI_MAX_PURCHASE_QTY,
  MOCHI_MAX_PURCHASE_KRW,
} from "@/lib/issuance";

const CREATOR_EMAIL = "moneytest-creator@motoo.test";
const FAN_EMAIL = "moneytest-fan@motoo.test";
// Eligibility fixtures — the three states `assertCanPurchase` distinguishes.
const UNVERIFIED_EMAIL = "moneytest-unverified@motoo.test";
const MINOR_EMAIL = "moneytest-minor@motoo.test";
const CONSENTED_MINOR_EMAIL = "moneytest-minor-consented@motoo.test";
const HANDLE = "moneytest_creator";

// Fixture rate: 200 KRW donated earns 1 mochi. Below-price-only donations
// (100, 200×N) map to the exact same resulting mochi counts the old
// quantity-driven fixtures produced, so downstream assertions didn't need to
// change — only the input shape (an amount, not a quantity) did.
const PRICE = 200;

let streamerId: string;
let backerId: string;
let unverifiedId: string;
let minorId: string;
let consentedMinorId: string;

async function cleanup() {
  const s = await prisma.streamer.findUnique({ where: { handle: HANDLE } });
  if (s) {
    await prisma.order.deleteMany({ where: { streamerId: s.id } });
    await prisma.mochiHolding.deleteMany({ where: { streamerId: s.id } });
    await prisma.marketplaceItem.deleteMany({ where: { streamerId: s.id } });
    await prisma.mochiIssuance.deleteMany({ where: { streamerId: s.id } });
    await prisma.streamer.delete({ where: { id: s.id } });
  }
  for (const email of [
    FAN_EMAIL,
    UNVERIFIED_EMAIL,
    MINOR_EMAIL,
    CONSENTED_MINOR_EMAIL,
    CREATOR_EMAIL,
  ]) {
    const b = await prisma.backer.findUnique({ where: { email } });
    if (b) await prisma.backer.delete({ where: { id: b.id } });
  }
}

async function newItem(
  priceMochi: number,
  stock: number | null = null,
  fulfillment: "instant" | "request" = "request",
) {
  return prisma.marketplaceItem.create({
    data: { streamerId, title: "test-item", priceMochi, itemType: "digital", fulfillment, stock },
  });
}

before(async () => {
  await cleanup();
  const owner = await prisma.backer.create({
    data: { email: CREATOR_EMAIL, nickname: "MT Creator", role: "streamer", verifiedAt: new Date(), ageVerified: true },
  });
  const streamer = await prisma.streamer.create({
    data: { handle: HANDLE, displayName: "MT Creator", category: "game", status: "approved", ownerId: owner.id },
  });
  streamerId = streamer.id;
  await prisma.mochiIssuance.create({
    data: { streamerId, pricePerMochiKrw: PRICE, goalQuantity: 100, grantedQuantity: 0, active: true },
  });
  // `verifiedAt` is required now, not just `ageVerified` — donateMochi gates on
  // a completed 본인인증 before it gates on age.
  const fan = await prisma.backer.create({
    data: { email: FAN_EMAIL, nickname: "MT Fan", role: "backer", verifiedAt: new Date(), ageVerified: true, emailVerifiedAt: new Date() },
  });
  backerId = fan.id;

  // Never completed 본인인증.
  const unverified = await prisma.backer.create({
    data: { email: UNVERIFIED_EMAIL, nickname: "MT Unverified", role: "backer" },
  });
  unverifiedId = unverified.id;

  // Verified as a minor, guardian never asked (guardianConsent stays false).
  const minor = await prisma.backer.create({
    data: { email: MINOR_EMAIL, nickname: "MT Minor", role: "backer", verifiedAt: new Date(), ageVerified: false, guardianConsent: false, emailVerifiedAt: new Date() },
  });
  minorId = minor.id;

  // Verified as a minor, guardian consent recorded — allowed to transact.
  const consented = await prisma.backer.create({
    data: { email: CONSENTED_MINOR_EMAIL, nickname: "MT Minor OK", role: "backer", verifiedAt: new Date(), ageVerified: false, guardianConsent: true, emailVerifiedAt: new Date() },
  });
  consentedMinorId = consented.id;
});

after(async () => {
  await cleanup();
  await prisma.$disconnect();
});

beforeEach(async () => {
  await prisma.order.deleteMany({ where: { streamerId } });
  // Ledger rows too — most tests donate with idempotencyKey "k", and the
  // unique index on it is exactly what stops a retried charge becoming two
  // donations, so leaving rows behind would make every test after the first a
  // duplicate-key failure.
  await prisma.donation.deleteMany({ where: { streamerId } });
  await prisma.block.deleteMany({ where: { streamerId } });
  await prisma.marketplaceItem.deleteMany({ where: { streamerId } });
  await prisma.mochiHolding.deleteMany({ where: { streamerId } });
  // The rate is reset too: the ceiling tests below move it to isolate which cap
  // binds, and every other test reasons in multiples of PRICE.
  await prisma.mochiIssuance.update({ where: { streamerId }, data: { grantedQuantity: 0, active: true, pricePerMochiKrw: PRICE } });
  // …and the status, since the suspension tests move it and every other test
  // assumes an approved creator.
  await prisma.streamer.update({
    where: { id: streamerId },
    data: { status: "approved" },
  });
});

describe("donateMochi", () => {
  it("credits the holding and advances grantedQuantity; grants floor(amount/price) mochi", async () => {
    const r = await donateMochi({ backerId, streamerId, donationAmountKrw: 10 * PRICE, idempotencyKey: "k" });
    assert.equal(r.balance, 10);
    assert.equal(r.mochiGranted, 10);
    assert.equal(r.amountKrw, 2000);
    const iss = await prisma.mochiIssuance.findUniqueOrThrow({ where: { streamerId } });
    assert.equal(iss.grantedQuantity, 10);
  });

  it("floors an uneven donation and keeps the full KRW with the creator", async () => {
    const r = await donateMochi({ backerId, streamerId, donationAmountKrw: 2050, idempotencyKey: "k" });
    assert.equal(r.mochiGranted, 10); // floor(2050 / 200) = 10, not 10.25
    assert.equal(r.amountKrw, 2050); // full amount still charged/settled — no mochi "change"
  });

  it("rejects a donation below the current per-mochi rate", async () => {
    await assert.rejects(
      () => donateMochi({ backerId, streamerId, donationAmountKrw: 100, idempotencyKey: "k" }),
      /DONATION_BELOW_MIN/,
    );
  });

  it("rejects when the bonus is paused", async () => {
    await prisma.mochiIssuance.update({ where: { streamerId }, data: { active: false } });
    await assert.rejects(
      () => donateMochi({ backerId, streamerId, donationAmountKrw: PRICE, idempotencyKey: "k" }),
      /MOCHI_BONUS_PAUSED/,
    );
  });

  it("rejects a non-positive donation amount", async () => {
    await assert.rejects(
      () => donateMochi({ backerId, streamerId, donationAmountKrw: 0, idempotencyKey: "k" }),
      /INVALID_AMOUNT/,
    );
  });
});

/**
 * Per-donation ceilings. Before these existed the donation amount was an
 * unbounded positive integer and the mock PG succeeds unconditionally — so a
 * hand-crafted request could mint millions of mochi for free, and a large
 * enough one overflowed the Int4 columns mid-transaction (after the charge).
 * Both ends are now closed: the KRW the fan is charged, and the mochi granted.
 */
describe("donateMochi — per-donation ceilings", () => {
  it("rejects a donation that would grant more than the unit cap", async () => {
    // At the fixture rate the KRW cap always binds first (1,000,000 ÷ 200 =
    // 5,000 mochi, half the unit cap), so the unit cap can only be isolated at
    // a cheaper rate: at 50원/mochi a donation exactly AT the KRW cap — which
    // the money ceiling therefore lets through — earns 20,000 mochi.
    await prisma.mochiIssuance.update({
      where: { streamerId },
      data: { pricePerMochiKrw: 50 },
    });
    await assert.rejects(
      () =>
        donateMochi({
          backerId,
          streamerId,
          donationAmountKrw: MOCHI_MAX_PURCHASE_KRW,
          idempotencyKey: "k",
        }),
      /QUANTITY_TOO_LARGE/,
    );
  });

  it("rejects a donation above the per-donation KRW cap", async () => {
    // One rate-step over the money cap, still well under the unit cap.
    const amount = MOCHI_MAX_PURCHASE_KRW + PRICE;
    assert.ok(
      Math.floor(amount / PRICE) <= MOCHI_MAX_PURCHASE_QTY,
      "fixture must isolate the KRW cap",
    );
    await assert.rejects(
      () => donateMochi({ backerId, streamerId, donationAmountKrw: amount, idempotencyKey: "k" }),
      /AMOUNT_TOO_LARGE/,
    );
  });

  it("credits nothing and advances nothing when a donation is rejected", async () => {
    await assert.rejects(() =>
      donateMochi({
        backerId,
        streamerId,
        donationAmountKrw: MOCHI_MAX_PURCHASE_KRW + PRICE,
        idempotencyKey: "k",
      }),
    );
    assert.equal(await getHolding(streamerId, backerId), null);
    const iss = await prisma.mochiIssuance.findUniqueOrThrow({ where: { streamerId } });
    assert.equal(iss.grantedQuantity, 0, "a rejected donation must not move the meter");
  });

  it("accepts a donation exactly at the KRW cap", async () => {
    const r = await donateMochi({
      backerId,
      streamerId,
      donationAmountKrw: MOCHI_MAX_PURCHASE_KRW,
      idempotencyKey: "k",
    });
    assert.equal(r.amountKrw, MOCHI_MAX_PURCHASE_KRW, "the cap is inclusive");
    assert.equal(r.balance, MOCHI_MAX_PURCHASE_KRW / PRICE);
  });
});

/**
 * Donor eligibility. Korea gates payments on 본인인증, and the /refund 법령
 * carve-out promises a minor's payment is refundable — a rule the product can
 * only honour if it evaluates it. Adults pass; minors need recorded guardian
 * consent; unverified accounts never reach the PG at all.
 */
/**
 * Suspension. The page queries already refuse to find a suspended creator, but
 * that does nothing about a donate page open when the suspension lands, or a
 * hand-crafted action call — so the rule lives in the money path and is tested
 * here with the rest of them.
 */
describe("donateMochi — suspended creator", () => {
  it("refuses a donation to a suspended creator", async () => {
    await prisma.streamer.update({
      where: { id: streamerId },
      data: { status: "suspended" },
    });
    await assert.rejects(
      () =>
        donateMochi({
          backerId,
          streamerId,
          donationAmountKrw: 10 * PRICE,
          idempotencyKey: "k",
        }),
      /CREATOR_UNAVAILABLE/,
    );
    assert.equal(
      await getHolding(streamerId, backerId),
      null,
      "nothing credited",
    );
  });

  it("still lets a fan spend mochi they already earned", async () => {
    // The deliberate asymmetry: suspension stops new money reaching the
    // creator, but must not strand a balance a fan already holds — that would
    // punish the fan for someone else's conduct (cf. DECISIONS 2026-08-07 on
    // forfeiture).
    await donateMochi({
      backerId,
      streamerId,
      donationAmountKrw: 10 * PRICE,
      idempotencyKey: "k",
    });
    await prisma.streamer.update({
      where: { id: streamerId },
      data: { status: "suspended" },
    });

    const item = await newItem(4);
    const r = await redeemItem({ backerId, itemId: item.id });
    assert.equal(r.balance, 6);
  });
});

describe("donateMochi — donor eligibility", () => {
  it("rejects a donor who has not completed 본인인증", async () => {
    await assert.rejects(
      () =>
        donateMochi({ backerId: unverifiedId, streamerId, donationAmountKrw: PRICE, idempotencyKey: "k" }),
      /NOT_VERIFIED/,
    );
  });

  it("rejects a minor with no guardian consent", async () => {
    await assert.rejects(
      () => donateMochi({ backerId: minorId, streamerId, donationAmountKrw: PRICE, idempotencyKey: "k" }),
      /GUARDIAN_CONSENT_REQUIRED/,
    );
  });

  it("allows a minor once guardian consent is recorded", async () => {
    // The gate is consent, not age — a consented minor may transact.
    const r = await donateMochi({
      backerId: consentedMinorId,
      streamerId,
      donationAmountKrw: 2 * PRICE,
      idempotencyKey: "k",
    });
    assert.equal(r.balance, 2);
  });

  it("charges nothing when the donor is ineligible", async () => {
    await assert.rejects(() =>
      donateMochi({ backerId: minorId, streamerId, donationAmountKrw: 5 * PRICE, idempotencyKey: "k" }),
    );
    assert.equal(await getHolding(streamerId, minorId), null);
    const iss = await prisma.mochiIssuance.findUniqueOrThrow({ where: { streamerId } });
    assert.equal(iss.grantedQuantity, 0);
  });
});

/**
 * Admin takedown. Two properties: it stops redemption even from a page that
 * already had the item, and it is *not* the creator's own `active` switch — a
 * takedown a creator can undo from their Studio is not a takedown.
 */
describe("redeemItem — admin takedown", () => {
  it("refuses a hidden item", async () => {
    await donateMochi({
      backerId,
      streamerId,
      donationAmountKrw: 10 * PRICE,
      idempotencyKey: "k",
    });
    const item = await newItem(4);
    await prisma.marketplaceItem.update({
      where: { id: item.id },
      data: { hiddenAt: new Date(), hiddenBy: "admin@motoo.test" },
    });

    await assert.rejects(
      () => redeemItem({ backerId, itemId: item.id }),
      /ITEM_UNAVAILABLE/,
    );
    assert.equal(
      (await getHolding(streamerId, backerId))?.balance,
      10,
      "nothing spent",
    );
  });

  it("stays hidden even when the creator's own switch is on", async () => {
    const item = await newItem(4);
    await prisma.marketplaceItem.update({
      where: { id: item.id },
      data: { hiddenAt: new Date(), active: true },
    });
    const row = await prisma.marketplaceItem.findUniqueOrThrow({
      where: { id: item.id },
    });
    assert.ok(row.active, "creator switch is on");
    assert.ok(row.hiddenAt, "and the takedown still stands");

    await donateMochi({
      backerId,
      streamerId,
      donationAmountKrw: 10 * PRICE,
      idempotencyKey: "k",
    });
    await assert.rejects(
      () => redeemItem({ backerId, itemId: item.id }),
      /ITEM_UNAVAILABLE/,
    );
  });
});

describe("redeemItem", () => {
  it("debits balance, records a pending order, and bumps redeemedCount", async () => {
    await donateMochi({ backerId, streamerId, donationAmountKrw: 10 * PRICE, idempotencyKey: "k" });
    const item = await newItem(3);
    const r = await redeemItem({ backerId, itemId: item.id, note: "hi" });
    assert.equal(r.mochiSpent, 3);
    assert.equal(r.balance, 7);
    const order = await prisma.order.findUniqueOrThrow({ where: { id: r.orderId } });
    assert.equal(order.status, "pending");
    assert.equal(r.instant, false);
    assert.equal(order.note, "hi");
    const after = await prisma.marketplaceItem.findUniqueOrThrow({ where: { id: item.id } });
    assert.equal(after.redeemedCount, 1);
  });

  it("auto-fulfills an instant item on redemption (no pending order)", async () => {
    await donateMochi({ backerId, streamerId, donationAmountKrw: 10 * PRICE, idempotencyKey: "k" });
    const item = await newItem(3, null, "instant");
    const r = await redeemItem({ backerId, itemId: item.id });
    assert.equal(r.instant, true);
    assert.equal(r.balance, 7); // mochi still moves
    const order = await prisma.order.findUniqueOrThrow({ where: { id: r.orderId } });
    assert.equal(order.status, "fulfilled");
    assert.ok(order.fulfilledAt); // stamped at redemption
  });

  it("rejects when balance is insufficient (and leaves balance untouched)", async () => {
    await donateMochi({ backerId, streamerId, donationAmountKrw: 2 * PRICE, idempotencyKey: "k" });
    const item = await newItem(5);
    await assert.rejects(() => redeemItem({ backerId, itemId: item.id }), /INSUFFICIENT_MOCHI/);
    const h = await getHolding(streamerId, backerId);
    assert.equal(h?.balance, 2);
  });

  it("rejects when stock is exhausted", async () => {
    await donateMochi({ backerId, streamerId, donationAmountKrw: 100 * PRICE, idempotencyKey: "k" });
    const item = await newItem(1, 1);
    await redeemItem({ backerId, itemId: item.id });
    await assert.rejects(() => redeemItem({ backerId, itemId: item.id }), /OUT_OF_STOCK/);
  });
});

describe("cancelOrder", () => {
  it("refunds the exact mochi and frees the stock", async () => {
    await donateMochi({ backerId, streamerId, donationAmountKrw: 10 * PRICE, idempotencyKey: "k" });
    const item = await newItem(4, 2);
    const r = await redeemItem({ backerId, itemId: item.id });
    const c = await cancelOrder(r.orderId, streamerId);
    assert.equal(c.status, "cancelled");
    const h = await getHolding(streamerId, backerId);
    assert.equal(h?.balance, 10);
    const after = await prisma.marketplaceItem.findUniqueOrThrow({ where: { id: item.id } });
    assert.equal(after.redeemedCount, 0);
  });

  it("refuses to cancel another creator's order", async () => {
    await donateMochi({ backerId, streamerId, donationAmountKrw: 10 * PRICE, idempotencyKey: "k" });
    const item = await newItem(4);
    const r = await redeemItem({ backerId, itemId: item.id });
    await assert.rejects(() => cancelOrder(r.orderId, "some-other-streamer"), /NOT_FOUND/);
  });
});

/**
 * Buyer-initiated cancellation. Spending used to be irreversible from the fan's
 * side — only the creator could cancel — so a mis-tapped redemption had no undo.
 */
describe("cancelOrderByBuyer", () => {
  it("refunds the exact mochi and frees the stock", async () => {
    await donateMochi({ backerId, streamerId, donationAmountKrw: 10 * PRICE, idempotencyKey: "k" });
    const item = await newItem(4, 2);
    const r = await redeemItem({ backerId, itemId: item.id });
    const c = await cancelOrderByBuyer(r.orderId, backerId);
    assert.equal(c.status, "cancelled");
    assert.equal((await getHolding(streamerId, backerId))?.balance, 10);
    const after = await prisma.marketplaceItem.findUniqueOrThrow({ where: { id: item.id } });
    assert.equal(after.redeemedCount, 0);
  });

  it("refuses to cancel someone else's order", async () => {
    await donateMochi({ backerId, streamerId, donationAmountKrw: 10 * PRICE, idempotencyKey: "k" });
    const item = await newItem(4);
    const r = await redeemItem({ backerId, itemId: item.id });
    await assert.rejects(
      () => cancelOrderByBuyer(r.orderId, consentedMinorId),
      /NOT_FOUND/,
    );
    // ...and the money stayed put.
    assert.equal((await getHolding(streamerId, backerId))?.balance, 6);
  });

  it("cannot cancel an already-fulfilled order", async () => {
    await donateMochi({ backerId, streamerId, donationAmountKrw: 10 * PRICE, idempotencyKey: "k" });
    // `instant` items are recorded fulfilled at redemption, so this covers the
    // "creator already did the work" case without needing the creator path.
    const item = await newItem(4, null, "instant");
    const r = await redeemItem({ backerId, itemId: item.id });
    await assert.rejects(() => cancelOrderByBuyer(r.orderId, backerId), /NOT_PENDING/);
    assert.equal((await getHolding(streamerId, backerId))?.balance, 6);
  });

  it("refunds exactly once when the buyer and creator cancel simultaneously", async () => {
    await donateMochi({ backerId, streamerId, donationAmountKrw: 10 * PRICE, idempotencyKey: "k" });
    const item = await newItem(4, 2);
    const r = await redeemItem({ backerId, itemId: item.id });

    const results = await Promise.allSettled([
      cancelOrderByBuyer(r.orderId, backerId),
      cancelOrder(r.orderId, streamerId),
    ]);
    const ok = results.filter((x) => x.status === "fulfilled").length;
    assert.equal(ok, 1, "exactly one cancel should win");

    // The real assertion: the balance is refunded once, not twice. Before the
    // status transition was claimed atomically, both callers could read
    // `pending` and both credit the holding.
    assert.equal((await getHolding(streamerId, backerId))?.balance, 10);
    const after = await prisma.marketplaceItem.findUniqueOrThrow({ where: { id: item.id } });
    assert.equal(after.redeemedCount, 0, "stock is released once, not twice");
  });

  it("refunds exactly once under a burst of buyer cancels", async () => {
    await donateMochi({ backerId, streamerId, donationAmountKrw: 10 * PRICE, idempotencyKey: "k" });
    const item = await newItem(3);
    const r = await redeemItem({ backerId, itemId: item.id });

    const results = await Promise.allSettled(
      Array.from({ length: 5 }, () => cancelOrderByBuyer(r.orderId, backerId)),
    );
    assert.equal(results.filter((x) => x.status === "fulfilled").length, 1);
    assert.equal((await getHolding(streamerId, backerId))?.balance, 10);
  });
});

describe("concurrency safety (the review fix)", () => {
  it("never overspends a holding under concurrent redemptions", async () => {
    await donateMochi({ backerId, streamerId, donationAmountKrw: 10 * PRICE, idempotencyKey: "k" });
    const item = await newItem(3);
    const results = await Promise.allSettled(
      Array.from({ length: 6 }, () => redeemItem({ backerId, itemId: item.id })),
    );
    const ok = results.filter((r) => r.status === "fulfilled").length;
    assert.equal(ok, 3, "exactly floor(10/3) redemptions should succeed");
    const h = await getHolding(streamerId, backerId);
    assert.equal(h?.balance, 1);
    assert.ok((h?.balance ?? -1) >= 0, "balance must never go negative");
  });

  it("never oversells limited stock under concurrent redemptions", async () => {
    await donateMochi({ backerId, streamerId, donationAmountKrw: 1000 * PRICE, idempotencyKey: "k" });
    const item = await newItem(1, 2);
    const results = await Promise.allSettled(
      Array.from({ length: 8 }, () => redeemItem({ backerId, itemId: item.id })),
    );
    const ok = results.filter((r) => r.status === "fulfilled").length;
    assert.equal(ok, 2, "only `stock` redemptions should succeed");
    const after = await prisma.marketplaceItem.findUniqueOrThrow({ where: { id: item.id } });
    assert.equal(after.redeemedCount, 2);
  });
});

describe("the donation ledger", () => {
  it("writes exactly one row per donation, with the rate that applied", async () => {
    await donateMochi({ backerId, streamerId, donationAmountKrw: 10 * PRICE, idempotencyKey: "k" });
    const rows = await prisma.donation.findMany({ where: { streamerId, backerId } });
    assert.equal(rows.length, 1);
    assert.equal(rows[0].amountKrw, 10 * PRICE);
    assert.equal(rows[0].mochiGranted, 10);
    // The rate ratchets, so it cannot be recovered later — a receipt that can't
    // explain its own arithmetic isn't a receipt.
    assert.equal(rows[0].pricePerMochiKrw, PRICE);
  });

  it("records the amount actually donated, not the mochi-equivalent", async () => {
    await donateMochi({ backerId, streamerId, donationAmountKrw: 2050, idempotencyKey: "k" });
    const row = await prisma.donation.findFirstOrThrow({ where: { streamerId, backerId } });
    assert.equal(row.amountKrw, 2050); // the full amount reaches the creator
    assert.equal(row.mochiGranted, 10); // floor(2050/200)
  });

  it("writes no row when the donation is refused", async () => {
    await assert.rejects(
      () => donateMochi({ backerId, streamerId, donationAmountKrw: 100, idempotencyKey: "k" }),
      /DONATION_BELOW_MIN/,
    );
    assert.equal(await prisma.donation.count({ where: { streamerId } }), 0);
  });

  it("refuses a second row for one payment (a retried charge)", async () => {
    await donateMochi({ backerId, streamerId, donationAmountKrw: PRICE, idempotencyKey: "dup" });
    await assert.rejects(() =>
      donateMochi({ backerId, streamerId, donationAmountKrw: PRICE, idempotencyKey: "dup" }),
    );
    assert.equal(await prisma.donation.count({ where: { streamerId } }), 1);
    // …and the credit rolled back with it: the ledger and the balance cannot
    // disagree, because they are written in one transaction.
    assert.equal((await getHolding(streamerId, backerId))?.balance, 1);
  });

  it("keeps the ledger and the running totals in agreement", async () => {
    await donateMochi({ backerId, streamerId, donationAmountKrw: 3 * PRICE, idempotencyKey: "a" });
    await donateMochi({ backerId, streamerId, donationAmountKrw: 7 * PRICE, idempotencyKey: "b" });
    const rows = await prisma.donation.findMany({ where: { streamerId, backerId } });
    const holding = await getHolding(streamerId, backerId);
    assert.equal(
      rows.reduce((sum, r) => sum + r.amountKrw, 0),
      holding?.krwPaidTotal,
    );
    assert.equal(
      rows.reduce((sum, r) => sum + r.mochiGranted, 0),
      holding?.mochiEarnedTotal,
    );
  });
});

describe("refund eligibility", () => {
  it("is eligible while inside the window with the mochi untouched", async () => {
    await donateMochi({ backerId, streamerId, donationAmountKrw: 10 * PRICE, idempotencyKey: "k" });
    const d = await prisma.donation.findFirstOrThrow({ where: { streamerId } });
    assert.deepEqual(await checkRefundEligibility(d.id), { eligible: true });
  });

  it("is not eligible once the 7-day window has passed", async () => {
    await donateMochi({ backerId, streamerId, donationAmountKrw: 10 * PRICE, idempotencyKey: "k" });
    const d = await prisma.donation.findFirstOrThrow({ where: { streamerId } });
    await prisma.donation.update({
      where: { id: d.id },
      data: { createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) },
    });
    assert.deepEqual(await checkRefundEligibility(d.id), {
      eligible: false,
      reason: "expired",
    });
  });

  it("is not eligible once any of it has been spent", async () => {
    await donateMochi({ backerId, streamerId, donationAmountKrw: 10 * PRICE, idempotencyKey: "k" });
    const d = await prisma.donation.findFirstOrThrow({ where: { streamerId } });
    const item = await newItem(1);
    await redeemItem({ backerId, itemId: item.id });
    assert.deepEqual(await checkRefundEligibility(d.id), {
      eligible: false,
      reason: "spent",
    });
  });

  // Mochi is fungible, so "not one mochi from *that* donation" is enforced as
  // "the balance still covers it". A later donation therefore raises the bar it
  // has to clear, rather than papering over spending from an earlier one.
  it("does not let a later donation revive an already-spent one", async () => {
    await donateMochi({ backerId, streamerId, donationAmountKrw: 10 * PRICE, idempotencyKey: "a" });
    const first = await prisma.donation.findFirstOrThrow({ where: { streamerId } });
    const item = await newItem(4);
    await redeemItem({ backerId, itemId: item.id }); // balance 10 → 6
    await donateMochi({ backerId, streamerId, donationAmountKrw: 5 * PRICE, idempotencyKey: "b" });
    // Balance is 11 now, but the second donation granted 5 of that, so the
    // first's 10 is still not covered.
    assert.deepEqual(await checkRefundEligibility(first.id), {
      eligible: false,
      reason: "spent",
    });
  });

  it("refuses a second request for one donation", async () => {
    await donateMochi({ backerId, streamerId, donationAmountKrw: PRICE, idempotencyKey: "k" });
    const d = await prisma.donation.findFirstOrThrow({ where: { streamerId } });
    await prisma.refundRequest.create({
      data: { backerId, donationId: d.id, reason: "withdrawal", eligibleAtRequest: true },
    });
    assert.deepEqual(await checkRefundEligibility(d.id), {
      eligible: false,
      reason: "alreadyRequested",
    });
    await assert.rejects(() =>
      prisma.refundRequest.create({
        data: { backerId, donationId: d.id, reason: "legal", eligibleAtRequest: false },
      }),
    );
  });
});

/**
 * A completed refund takes the mochi back with the money. Without this, asking
 * for a refund would be a way to keep the bonus and the cash, and the creator's
 * lifetime totals would keep counting a donation that no longer exists.
 *
 * Tested at the Prisma layer for the same reason the report tests are: the
 * action needs an admin session these tests don't have, and what matters is the
 * arithmetic, not the button.
 */
describe("refund completion", () => {
  it("removes the granted mochi and the lifetime totals it added", async () => {
    await donateMochi({ backerId, streamerId, donationAmountKrw: 10 * PRICE, idempotencyKey: "k" });
    const d = await prisma.donation.findFirstOrThrow({ where: { streamerId } });

    await prisma.$transaction(async (tx) => {
      await tx.donation.update({ where: { id: d.id }, data: { refundedAt: new Date() } });
      const h = await tx.mochiHolding.findUniqueOrThrow({
        where: { streamerId_backerId: { streamerId, backerId } },
      });
      await tx.mochiHolding.update({
        where: { id: h.id },
        data: {
          balance: Math.max(0, h.balance - d.mochiGranted),
          mochiEarnedTotal: { decrement: d.mochiGranted },
          krwPaidTotal: { decrement: d.amountKrw },
        },
      });
    });

    const h = await getHolding(streamerId, backerId);
    assert.equal(h?.balance, 0);
    assert.equal(h?.mochiEarnedTotal, 0);
    assert.equal(h?.krwPaidTotal, 0);
  });

  it("stops a refunded donation from holding a later one hostage", async () => {
    await donateMochi({ backerId, streamerId, donationAmountKrw: 4 * PRICE, idempotencyKey: "a" });
    const first = await prisma.donation.findFirstOrThrow({ where: { streamerId } });
    await donateMochi({ backerId, streamerId, donationAmountKrw: 6 * PRICE, idempotencyKey: "b" });
    const second = await prisma.donation.findFirstOrThrow({
      where: { streamerId, id: { not: first.id } },
    });

    // Refund the first: 10 → 6 mochi, and its 4 leave the "granted since" sum.
    await prisma.$transaction(async (tx) => {
      await tx.donation.update({ where: { id: first.id }, data: { refundedAt: new Date() } });
      const h = await tx.mochiHolding.findUniqueOrThrow({
        where: { streamerId_backerId: { streamerId, backerId } },
      });
      await tx.mochiHolding.update({
        where: { id: h.id },
        data: { balance: h.balance - first.mochiGranted },
      });
    });

    assert.deepEqual(await checkRefundEligibility(second.id), { eligible: true });
  });
});

/**
 * The guardian-consent gate, from both sides of the transition.
 *
 * The refusal has been tested since the eligibility work, but until
 * /guardian-consent existed nothing could ever record consent — so the *allowed*
 * side was only ever exercised by a fixture that started out consented. These
 * cover the change itself, which is what the new page performs.
 */
describe("guardian consent unblocks a minor", () => {
  it("goes from refused to allowed when consent is recorded, and back", async () => {
    await assert.rejects(
      () => donateMochi({ backerId: minorId, streamerId, donationAmountKrw: PRICE, idempotencyKey: "g1" }),
      /GUARDIAN_CONSENT_REQUIRED/,
    );

    await prisma.backer.update({
      where: { id: minorId },
      data: {
        guardianConsent: true,
        guardianConsentAt: new Date(),
        guardianName: "MT Guardian",
        guardianRelation: "parent",
        guardianContact: "010-0000-0000",
      },
    });
    const r = await donateMochi({ backerId: minorId, streamerId, donationAmountKrw: PRICE, idempotencyKey: "g2" });
    assert.equal(r.balance, 1);

    // Withdrawal has to re-block immediately — a consent you can take back but
    // that keeps working isn't withdrawable.
    await prisma.backer.update({
      where: { id: minorId },
      data: { guardianConsent: false, guardianConsentAt: null, guardianName: null, guardianRelation: null, guardianContact: null },
    });
    await assert.rejects(
      () => donateMochi({ backerId: minorId, streamerId, donationAmountKrw: PRICE, idempotencyKey: "g3" }),
      /GUARDIAN_CONSENT_REQUIRED/,
    );
  });
});

/**
 * Blocking, and specifically the line it must not cross.
 *
 * A creator blocking a supporter stops new donations. It deliberately does NOT
 * stop that supporter spending mochi they already hold — blocking someone who
 * holds your currency would otherwise confiscate it, and refusing someone's
 * money is a creator's right in a way that keeping it is not. The asymmetry is
 * the whole design, so it is the thing worth testing.
 */
describe("creator blocks", () => {
  it("refuses a new donation from a blocked supporter", async () => {
    await prisma.block.create({
      data: { backerId, streamerId, initiator: "creator" },
    });
    await assert.rejects(
      () => donateMochi({ backerId, streamerId, donationAmountKrw: PRICE, idempotencyKey: "b1" }),
      /BLOCKED_BY_CREATOR/,
    );
    assert.equal(await prisma.donation.count({ where: { streamerId } }), 0);
  });

  it("still lets a blocked supporter spend the mochi they already hold", async () => {
    await donateMochi({ backerId, streamerId, donationAmountKrw: 10 * PRICE, idempotencyKey: "b2" });
    await prisma.block.create({
      data: { backerId, streamerId, initiator: "creator" },
    });
    const item = await newItem(4);
    const r = await redeemItem({ backerId, itemId: item.id });
    assert.equal(r.balance, 6);
  });

  it("does not stop a donation when the fan is the one who hid the creator", async () => {
    // A fan-side hide is curation, not a refusal — it changes what they are
    // shown, and nothing about what they may do.
    await prisma.block.create({
      data: { backerId, streamerId, initiator: "fan" },
    });
    const r = await donateMochi({ backerId, streamerId, donationAmountKrw: PRICE, idempotencyKey: "b3" });
    assert.equal(r.balance, 1);
  });

  it("takes a blocked supporter off the public leaderboard without touching their balance", async () => {
    await donateMochi({ backerId, streamerId, donationAmountKrw: 5 * PRICE, idempotencyKey: "b4" });
    const before = await getSupporterLeaderboard(streamerId);
    assert.equal(before.totalSupporters, 1);

    await prisma.block.create({
      data: { backerId, streamerId, initiator: "creator" },
    });
    const after = await getSupporterLeaderboard(streamerId);
    assert.equal(after.totalSupporters, 0);
    assert.equal(after.totalMochiEarned, 0);
    // The listing changed; the money did not.
    assert.equal((await getHolding(streamerId, backerId))?.balance, 5);
  });
});

/**
 * The fulfillment promise (docs/PRELAUNCH.md #32).
 *
 * The point of stamping `dueAt` at redemption rather than reading the item's
 * window later is that a creator must not be able to move a deadline they have
 * already given someone. That is the test worth having.
 */
describe("fulfillment promise", () => {
  it("stamps the promised date from the item's window", async () => {
    await donateMochi({ backerId, streamerId, donationAmountKrw: 10 * PRICE, idempotencyKey: "k" });
    const item = await prisma.marketplaceItem.create({
      data: {
        streamerId, title: "sla-item", priceMochi: 1, itemType: "digital",
        fulfillment: "request", fulfillmentDays: 3,
      },
    });
    const r = await redeemItem({ backerId, itemId: item.id });
    const order = await prisma.order.findUniqueOrThrow({ where: { id: r.orderId } });
    assert.ok(order.dueAt, "a promise was made, so it is recorded");
    const days = (order.dueAt!.getTime() - order.createdAt.getTime()) / 86_400_000;
    assert.ok(Math.abs(days - 3) < 0.01, `expected ~3 days, got ${days}`);
  });

  it("does not move a promise already made when the creator changes the window", async () => {
    await donateMochi({ backerId, streamerId, donationAmountKrw: 10 * PRICE, idempotencyKey: "k" });
    const item = await prisma.marketplaceItem.create({
      data: {
        streamerId, title: "sla-item", priceMochi: 1, itemType: "digital",
        fulfillment: "request", fulfillmentDays: 2,
      },
    });
    const r = await redeemItem({ backerId, itemId: item.id });
    const before = await prisma.order.findUniqueOrThrow({ where: { id: r.orderId } });

    await prisma.marketplaceItem.update({
      where: { id: item.id },
      data: { fulfillmentDays: 60 },
    });
    const after = await prisma.order.findUniqueOrThrow({ where: { id: r.orderId } });
    assert.deepEqual(after.dueAt, before.dueAt);
  });

  it("promises nothing when the creator set no window, and never on an instant item", async () => {
    await donateMochi({ backerId, streamerId, donationAmountKrw: 10 * PRICE, idempotencyKey: "k" });
    const silent = await newItem(1);
    const instant = await prisma.marketplaceItem.create({
      data: {
        streamerId, title: "instant-item", priceMochi: 1, itemType: "digital",
        fulfillment: "instant", fulfillmentDays: 5,
      },
    });

    const a = await redeemItem({ backerId, itemId: silent.id });
    const b = await redeemItem({ backerId, itemId: instant.id });
    assert.equal((await prisma.order.findUniqueOrThrow({ where: { id: a.orderId } })).dueAt, null);
    // An instant order is already fulfilled — a deadline on it would be a
    // promise about something that has happened.
    assert.equal((await prisma.order.findUniqueOrThrow({ where: { id: b.orderId } })).dueAt, null);
  });
});

/**
 * The email gate (docs/PRELAUNCH.md #3, owner's call 2026-08-18).
 *
 * Not about identity — 본인인증 covers that — but about reachability. `/refund`
 * is a live obligation, and a refund decision or cancellation notice sent to an
 * address nobody owns is a promise the product cannot keep.
 */
describe("donateMochi — email verification", () => {
  it("refuses a donor whose address was never confirmed", async () => {
    await prisma.backer.update({
      where: { id: backerId },
      data: { emailVerifiedAt: null },
    });
    await assert.rejects(
      () => donateMochi({ backerId, streamerId, donationAmountKrw: PRICE, idempotencyKey: "e1" }),
      /EMAIL_NOT_VERIFIED/,
    );
    // Nothing was charged and nothing was written.
    assert.equal(await prisma.donation.count({ where: { streamerId } }), 0);
    assert.equal(await getHolding(streamerId, backerId), null);

    await prisma.backer.update({
      where: { id: backerId },
      data: { emailVerifiedAt: new Date() },
    });
  });

  // Ordering matters: an unverified account should be told the actual reason,
  // not the first gate that happens to fire.
  it("still reports the identity gate first for an unverified account", async () => {
    await assert.rejects(
      () => donateMochi({ backerId: unverifiedId, streamerId, donationAmountKrw: PRICE, idempotencyKey: "e2" }),
      /NOT_VERIFIED/,
    );
  });
});
