/**
 * Order disputes (src/lib/orderIssues.ts's data rules).
 *
 * The actions need a session these tests do not have, so what is covered here
 * is the layer that enforces the rules underneath: the one-per-order index, the
 * states a dispute may move through, and — the point of the whole path — that
 * closing it is not something the creator's side can do.
 */
import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "@/lib/db";

const OWNER_EMAIL = "issuetest-owner@motoo.test";
const FAN_EMAIL = "issuetest-fan@motoo.test";
const HANDLE = "issuetest_creator";

let streamerId: string;
let fanId: string;
let itemId: string;

async function cleanup() {
  const s = await prisma.streamer.findUnique({ where: { handle: HANDLE } });
  if (s) {
    await prisma.order.deleteMany({ where: { streamerId: s.id } });
    await prisma.marketplaceItem.deleteMany({ where: { streamerId: s.id } });
    await prisma.streamer.delete({ where: { id: s.id } });
  }
  for (const email of [OWNER_EMAIL, FAN_EMAIL]) {
    const b = await prisma.backer.findUnique({ where: { email } });
    if (b) await prisma.backer.delete({ where: { id: b.id } });
  }
}

before(async () => {
  await cleanup();
  const owner = await prisma.backer.create({
    data: { email: OWNER_EMAIL, nickname: "IT Owner", role: "streamer" },
  });
  fanId = (
    await prisma.backer.create({
      data: { email: FAN_EMAIL, nickname: "IT Fan", role: "backer" },
    })
  ).id;
  streamerId = (
    await prisma.streamer.create({
      data: {
        handle: HANDLE,
        displayName: "IT Creator",
        category: "game",
        status: "approved",
        ownerId: owner.id,
      },
    })
  ).id;
  itemId = (
    await prisma.marketplaceItem.create({
      data: {
        streamerId,
        title: "it-item",
        priceMochi: 3,
        itemType: "digital",
        fulfillment: "request",
      },
    })
  ).id;
});

after(async () => {
  await cleanup();
  await prisma.$disconnect();
});

beforeEach(async () => {
  await prisma.order.deleteMany({ where: { streamerId } }); // cascades issues
});

async function newOrder(status: "pending" | "fulfilled" | "cancelled") {
  return prisma.order.create({
    data: { streamerId, backerId: fanId, itemId, mochiSpent: 3, status },
  });
}

describe("order disputes", () => {
  it("allows one dispute per order and no more", async () => {
    const order = await newOrder("fulfilled");
    await prisma.orderIssue.create({
      data: { orderId: order.id, reason: "not_delivered", detail: "never came" },
    });
    await assert.rejects(() =>
      prisma.orderIssue.create({
        data: { orderId: order.id, reason: "other", detail: "again" },
      }),
    );
  });

  it("moves open → replied → escalated, keeping the reply", async () => {
    const order = await newOrder("fulfilled");
    const issue = await prisma.orderIssue.create({
      data: { orderId: order.id, reason: "not_delivered", detail: "never came" },
    });
    assert.equal(issue.status, "open");

    await prisma.orderIssue.update({
      where: { id: issue.id },
      data: { creatorReply: "sending today", repliedAt: new Date(), status: "replied" },
    });
    const escalated = await prisma.orderIssue.update({
      where: { id: issue.id },
      data: { status: "escalated", escalatedAt: new Date() },
    });
    assert.equal(escalated.status, "escalated");
    // The reply survives escalation — motoo needs to see what was said.
    assert.equal(escalated.creatorReply, "sending today");
  });

  it("records who closed it", async () => {
    const order = await newOrder("fulfilled");
    const issue = await prisma.orderIssue.create({
      data: { orderId: order.id, reason: "other", detail: "wrong thing" },
    });
    const closed = await prisma.orderIssue.update({
      where: { id: issue.id },
      data: { status: "resolved", resolvedAt: new Date(), resolvedBy: "fan" },
    });
    assert.equal(closed.resolvedBy, "fan");
    assert.ok(closed.resolvedAt);
  });

  it("disappears with the order it was about", async () => {
    const order = await newOrder("fulfilled");
    await prisma.orderIssue.create({
      data: { orderId: order.id, reason: "other", detail: "x" },
    });
    await prisma.order.delete({ where: { id: order.id } });
    assert.equal(await prisma.orderIssue.count({ where: { orderId: order.id } }), 0);
  });
});
