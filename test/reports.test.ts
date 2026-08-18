/**
 * Integration tests for abuse reporting (src/app/report-actions.ts's data
 * rules, exercised through Prisma directly).
 *
 * The action itself needs a session, which these tests do not have — so what is
 * tested here is the layer that actually enforces the rules: the unique index
 * that makes duplicate reports impossible, and the status transitions the
 * triage queue depends on. A UI test would prove less and break more often.
 */
import { describe, it, before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "@/lib/db";

const REPORTER_EMAIL = "reporttest-reporter@motoo.test";
const OTHER_EMAIL = "reporttest-other@motoo.test";
const HANDLE = "reporttest_creator";
const CREATOR_EMAIL = "reporttest-creator@motoo.test";

let reporterId: string;
let otherId: string;
let streamerId: string;

async function cleanup() {
  const s = await prisma.streamer.findUnique({ where: { handle: HANDLE } });
  if (s) await prisma.streamer.delete({ where: { id: s.id } });
  for (const email of [REPORTER_EMAIL, OTHER_EMAIL, CREATOR_EMAIL]) {
    const b = await prisma.backer.findUnique({ where: { email } });
    if (b) await prisma.backer.delete({ where: { id: b.id } }); // cascades reports
  }
}

before(async () => {
  await cleanup();
  const reporter = await prisma.backer.create({
    data: { email: REPORTER_EMAIL, nickname: "Reporter", role: "backer" },
  });
  reporterId = reporter.id;
  const other = await prisma.backer.create({
    data: { email: OTHER_EMAIL, nickname: "Other", role: "backer" },
  });
  otherId = other.id;

  const owner = await prisma.backer.create({
    data: { email: CREATOR_EMAIL, nickname: "RT Creator", role: "streamer" },
  });
  const streamer = await prisma.streamer.create({
    data: {
      handle: HANDLE,
      displayName: "RT Creator",
      category: "game",
      status: "approved",
      ownerId: owner.id,
    },
  });
  streamerId = streamer.id;
});

after(async () => {
  await cleanup();
  await prisma.$disconnect();
});

beforeEach(async () => {
  await prisma.report.deleteMany({ where: { targetId: streamerId } });
});

describe("report dedupe", () => {
  it("allows one report per reporter per target", async () => {
    await prisma.report.create({
      data: {
        reporterId,
        targetType: "creator",
        targetId: streamerId,
        reason: "impersonation",
      },
    });

    await assert.rejects(
      () =>
        prisma.report.create({
          data: {
            reporterId,
            targetType: "creator",
            targetId: streamerId,
            reason: "scam",
          },
        }),
      /Unique constraint/,
      "a second report from the same person about the same target must not create a row — volume is a triage signal and one person must not be able to fake it",
    );
  });

  it("lets a different person report the same target", async () => {
    await prisma.report.create({
      data: {
        reporterId,
        targetType: "creator",
        targetId: streamerId,
        reason: "impersonation",
      },
    });
    await prisma.report.create({
      data: {
        reporterId: otherId,
        targetType: "creator",
        targetId: streamerId,
        reason: "impersonation",
      },
    });

    const count = await prisma.report.count({
      where: { targetId: streamerId },
    });
    assert.equal(count, 2);
  });

  it("lets the same person report a different target type with the same id", async () => {
    // targetId is not a foreign key, so the same string could in principle
    // appear for both types. The uniqueness is on the triple, not the pair.
    await prisma.report.create({
      data: {
        reporterId,
        targetType: "creator",
        targetId: streamerId,
        reason: "other",
      },
    });
    await prisma.report.create({
      data: {
        reporterId,
        targetType: "item",
        targetId: streamerId,
        reason: "other",
      },
    });
    const count = await prisma.report.count({
      where: { targetId: streamerId },
    });
    assert.equal(count, 2);
  });
});

describe("report triage", () => {
  it("starts open and leaves the queue once resolved", async () => {
    const r = await prisma.report.create({
      data: {
        reporterId,
        targetType: "creator",
        targetId: streamerId,
        reason: "scam",
      },
    });
    assert.equal(r.status, "open");

    const openBefore = await prisma.report.count({
      where: { targetId: streamerId, status: "open" },
    });
    assert.equal(openBefore, 1);

    await prisma.report.update({
      where: { id: r.id },
      data: {
        status: "actioned",
        reviewedAt: new Date(),
        reviewedBy: "admin@motoo.test",
        resolution: "suspended the creator",
      },
    });

    const openAfter = await prisma.report.count({
      where: { targetId: streamerId, status: "open" },
    });
    assert.equal(openAfter, 0, "a resolved report must not stay in the queue");
  });

  it("survives the deletion of what it was about", async () => {
    // The evidence has to outlive the item — that is why targetId is a bare id
    // rather than a foreign key with a cascade.
    const item = await prisma.marketplaceItem.create({
      data: {
        streamerId,
        title: "reported item",
        priceMochi: 5,
        itemType: "digital",
        fulfillment: "instant",
      },
    });
    await prisma.report.create({
      data: {
        reporterId,
        targetType: "item",
        targetId: item.id,
        reason: "scam",
      },
    });

    await prisma.marketplaceItem.delete({ where: { id: item.id } });

    const survived = await prisma.report.count({
      where: { targetId: item.id },
    });
    assert.equal(survived, 1);
    await prisma.report.deleteMany({ where: { targetId: item.id } });
  });
});
