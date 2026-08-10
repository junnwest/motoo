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
import { donateMochi, redeemItem, cancelOrder, getHolding } from "@/lib/mochi";

const CREATOR_EMAIL = "moneytest-creator@motoo.test";
const FAN_EMAIL = "moneytest-fan@motoo.test";
const HANDLE = "moneytest_creator";

// Fixture rate: 200 KRW donated earns 1 mochi. Below-price-only donations
// (100, 200×N) map to the exact same resulting mochi counts the old
// quantity-driven fixtures produced, so downstream assertions didn't need to
// change — only the input shape (an amount, not a quantity) did.
const PRICE = 200;

let streamerId: string;
let backerId: string;

async function cleanup() {
  const s = await prisma.streamer.findUnique({ where: { handle: HANDLE } });
  if (s) {
    await prisma.order.deleteMany({ where: { streamerId: s.id } });
    await prisma.mochiHolding.deleteMany({ where: { streamerId: s.id } });
    await prisma.marketplaceItem.deleteMany({ where: { streamerId: s.id } });
    await prisma.mochiIssuance.deleteMany({ where: { streamerId: s.id } });
    await prisma.streamer.delete({ where: { id: s.id } });
  }
  for (const email of [FAN_EMAIL, CREATOR_EMAIL]) {
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
    data: { email: CREATOR_EMAIL, nickname: "MT Creator", role: "streamer", ageVerified: true },
  });
  const streamer = await prisma.streamer.create({
    data: { handle: HANDLE, displayName: "MT Creator", category: "game", status: "approved", ownerId: owner.id },
  });
  streamerId = streamer.id;
  await prisma.mochiIssuance.create({
    data: { streamerId, pricePerMochiKrw: PRICE, goalQuantity: 100, grantedQuantity: 0, active: true },
  });
  const fan = await prisma.backer.create({
    data: { email: FAN_EMAIL, nickname: "MT Fan", role: "backer", ageVerified: true },
  });
  backerId = fan.id;
});

after(async () => {
  await cleanup();
  await prisma.$disconnect();
});

beforeEach(async () => {
  await prisma.order.deleteMany({ where: { streamerId } });
  await prisma.marketplaceItem.deleteMany({ where: { streamerId } });
  await prisma.mochiHolding.deleteMany({ where: { streamerId } });
  await prisma.mochiIssuance.update({ where: { streamerId }, data: { grantedQuantity: 0, active: true } });
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
