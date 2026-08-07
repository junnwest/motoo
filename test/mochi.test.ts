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
import { buyMochi, redeemItem, cancelOrder, getHolding } from "@/lib/mochi";
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
    data: { streamerId, pricePerMochiKrw: 200, goalQuantity: 100, soldQuantity: 0, active: true },
  });
  // `verifiedAt` is required now, not just `ageVerified` — buyMochi gates on a
  // completed 본인인증 before it gates on age.
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
  await prisma.mochiIssuance.update({ where: { streamerId }, data: { soldQuantity: 0, active: true } });
});

/** Issuance for these tests is 200원/mochi — used to reason about the KRW cap. */
const PRICE = 200;

describe("buyMochi", () => {
  it("credits the holding and advances soldQuantity; charges qty × price", async () => {
    const r = await buyMochi({ backerId, streamerId, quantity: 10, idempotencyKey: "k" });
    assert.equal(r.balance, 10);
    assert.equal(r.amountKrw, 2000);
    const iss = await prisma.mochiIssuance.findUniqueOrThrow({ where: { streamerId } });
    assert.equal(iss.soldQuantity, 10);
  });

  it("rejects when issuance is paused", async () => {
    await prisma.mochiIssuance.update({ where: { streamerId }, data: { active: false } });
    await assert.rejects(
      () => buyMochi({ backerId, streamerId, quantity: 1, idempotencyKey: "k" }),
      /MOCHI_NOT_ON_SALE/,
    );
  });

  it("rejects a non-positive quantity", async () => {
    await assert.rejects(
      () => buyMochi({ backerId, streamerId, quantity: 0, idempotencyKey: "k" }),
      /INVALID_QUANTITY/,
    );
  });
});

/**
 * Purchase ceilings. Before these existed, `quantity` was an unbounded positive
 * integer and the mock PG succeeds unconditionally — so a hand-crafted request
 * could mint millions of mochi for free, and a large enough one overflowed the
 * Int4 columns mid-transaction (after the charge). Both ends are now closed.
 */
describe("buyMochi — purchase ceilings", () => {
  it("rejects a quantity above the per-purchase unit cap", async () => {
    await assert.rejects(
      () =>
        buyMochi({
          backerId,
          streamerId,
          quantity: MOCHI_MAX_PURCHASE_QTY + 1,
          idempotencyKey: "k",
        }),
      /QUANTITY_TOO_LARGE/,
    );
  });

  it("rejects a purchase above the per-purchase KRW cap", async () => {
    // Under the unit cap, over the money cap: only the KRW ceiling can catch it.
    const quantity = Math.floor(MOCHI_MAX_PURCHASE_KRW / PRICE) + 1;
    assert.ok(quantity <= MOCHI_MAX_PURCHASE_QTY, "fixture must isolate the KRW cap");
    await assert.rejects(
      () => buyMochi({ backerId, streamerId, quantity, idempotencyKey: "k" }),
      /AMOUNT_TOO_LARGE/,
    );
  });

  it("credits nothing and advances nothing when a purchase is rejected", async () => {
    await assert.rejects(() =>
      buyMochi({
        backerId,
        streamerId,
        quantity: MOCHI_MAX_PURCHASE_QTY + 1,
        idempotencyKey: "k",
      }),
    );
    assert.equal(await getHolding(streamerId, backerId), null);
    const iss = await prisma.mochiIssuance.findUniqueOrThrow({ where: { streamerId } });
    assert.equal(iss.soldQuantity, 0, "a rejected purchase must not move the meter");
  });

  it("accepts a purchase exactly at the KRW cap", async () => {
    const quantity = Math.floor(MOCHI_MAX_PURCHASE_KRW / PRICE);
    const r = await buyMochi({ backerId, streamerId, quantity, idempotencyKey: "k" });
    assert.equal(r.amountKrw, MOCHI_MAX_PURCHASE_KRW, "the cap is inclusive");
    assert.equal(r.balance, quantity);
  });
});

/**
 * Buyer eligibility. Korea gates payments on 본인인증, and the /refund 법령
 * carve-out promises a minor's payment is refundable — a rule the product can
 * only honour if it evaluates it. Adults pass; minors need recorded guardian
 * consent; unverified accounts never reach the PG at all.
 */
describe("buyMochi — buyer eligibility", () => {
  it("rejects a buyer who has not completed 본인인증", async () => {
    await assert.rejects(
      () =>
        buyMochi({ backerId: unverifiedId, streamerId, quantity: 1, idempotencyKey: "k" }),
      /NOT_VERIFIED/,
    );
  });

  it("rejects a minor with no guardian consent", async () => {
    await assert.rejects(
      () => buyMochi({ backerId: minorId, streamerId, quantity: 1, idempotencyKey: "k" }),
      /GUARDIAN_CONSENT_REQUIRED/,
    );
  });

  it("allows a minor once guardian consent is recorded", async () => {
    // The gate is consent, not age — a consented minor may transact.
    const r = await buyMochi({
      backerId: consentedMinorId,
      streamerId,
      quantity: 2,
      idempotencyKey: "k",
    });
    assert.equal(r.balance, 2);
  });

  it("charges nothing when the buyer is ineligible", async () => {
    await assert.rejects(() =>
      buyMochi({ backerId: minorId, streamerId, quantity: 5, idempotencyKey: "k" }),
    );
    assert.equal(await getHolding(streamerId, minorId), null);
    const iss = await prisma.mochiIssuance.findUniqueOrThrow({ where: { streamerId } });
    assert.equal(iss.soldQuantity, 0);
  });
});

describe("redeemItem", () => {
  it("debits balance, records a pending order, and bumps redeemedCount", async () => {
    await buyMochi({ backerId, streamerId, quantity: 10, idempotencyKey: "k" });
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
    await buyMochi({ backerId, streamerId, quantity: 10, idempotencyKey: "k" });
    const item = await newItem(3, null, "instant");
    const r = await redeemItem({ backerId, itemId: item.id });
    assert.equal(r.instant, true);
    assert.equal(r.balance, 7); // money still moves
    const order = await prisma.order.findUniqueOrThrow({ where: { id: r.orderId } });
    assert.equal(order.status, "fulfilled");
    assert.ok(order.fulfilledAt); // stamped at redemption
  });

  it("rejects when balance is insufficient (and leaves balance untouched)", async () => {
    await buyMochi({ backerId, streamerId, quantity: 2, idempotencyKey: "k" });
    const item = await newItem(5);
    await assert.rejects(() => redeemItem({ backerId, itemId: item.id }), /INSUFFICIENT_MOCHI/);
    const h = await getHolding(streamerId, backerId);
    assert.equal(h?.balance, 2);
  });

  it("rejects when stock is exhausted", async () => {
    await buyMochi({ backerId, streamerId, quantity: 100, idempotencyKey: "k" });
    const item = await newItem(1, 1);
    await redeemItem({ backerId, itemId: item.id });
    await assert.rejects(() => redeemItem({ backerId, itemId: item.id }), /OUT_OF_STOCK/);
  });
});

describe("cancelOrder", () => {
  it("refunds the exact mochi and frees the stock", async () => {
    await buyMochi({ backerId, streamerId, quantity: 10, idempotencyKey: "k" });
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
    await buyMochi({ backerId, streamerId, quantity: 10, idempotencyKey: "k" });
    const item = await newItem(4);
    const r = await redeemItem({ backerId, itemId: item.id });
    await assert.rejects(() => cancelOrder(r.orderId, "some-other-streamer"), /NOT_FOUND/);
  });
});

describe("concurrency safety (the review fix)", () => {
  it("never overspends a holding under concurrent redemptions", async () => {
    await buyMochi({ backerId, streamerId, quantity: 10, idempotencyKey: "k" });
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
    await buyMochi({ backerId, streamerId, quantity: 1000, idempotencyKey: "k" });
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
