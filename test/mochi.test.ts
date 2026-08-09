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
    data: { email: FAN_EMAIL, nickname: "MT Fan", role: "backer", verifiedAt: new Date(), ageVerified: true },
  });
  backerId = fan.id;

  // Never completed 본인인증.
  const unverified = await prisma.backer.create({
    data: { email: UNVERIFIED_EMAIL, nickname: "MT Unverified", role: "backer" },
  });
  unverifiedId = unverified.id;

  // Verified as a minor, guardian never asked (guardianConsent stays false).
  const minor = await prisma.backer.create({
    data: { email: MINOR_EMAIL, nickname: "MT Minor", role: "backer", verifiedAt: new Date(), ageVerified: false, guardianConsent: false },
  });
  minorId = minor.id;

  // Verified as a minor, guardian consent recorded — allowed to transact.
  const consented = await prisma.backer.create({
    data: { email: CONSENTED_MINOR_EMAIL, nickname: "MT Minor OK", role: "backer", verifiedAt: new Date(), ageVerified: false, guardianConsent: true },
  });
  consentedMinorId = consented.id;
});

after(async () => {
  await cleanup();
  await prisma.$disconnect();
});

beforeEach(async () => {
  await prisma.order.deleteMany({ where: { streamerId } });
  await prisma.marketplaceItem.deleteMany({ where: { streamerId } });
  await prisma.mochiHolding.deleteMany({ where: { streamerId } });
  // The rate is reset too: the ceiling tests below move it to isolate which cap
  // binds, and every other test reasons in multiples of PRICE.
  await prisma.mochiIssuance.update({ where: { streamerId }, data: { grantedQuantity: 0, active: true, pricePerMochiKrw: PRICE } });
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
