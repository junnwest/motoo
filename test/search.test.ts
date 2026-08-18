/**
 * Global search (src/lib/search.ts).
 *
 * What is worth testing here is not that a substring match works — it is every
 * rule about what search must NOT return. Search reaches across creators,
 * items and posts at once, so it is the natural place for a visibility rule to
 * be forgotten, and the failure is silent: results simply include something
 * they shouldn't.
 */
import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "@/lib/db";
import { globalSearch, MIN_QUERY_LENGTH } from "@/lib/search";

const OWNER_EMAIL = "searchtest-owner@motoo.test";
const FAN_EMAIL = "searchtest-fan@motoo.test";
const HANDLE = "searchtest_creator";
// Distinctive enough that nothing in the seed or another fixture can match it.
const TOKEN = "zqxjkv";

let streamerId: string;
let fanId: string;

async function cleanup() {
  const s = await prisma.streamer.findUnique({ where: { handle: HANDLE } });
  if (s) await prisma.streamer.delete({ where: { id: s.id } });
  for (const email of [OWNER_EMAIL, FAN_EMAIL]) {
    const b = await prisma.backer.findUnique({ where: { email } });
    if (b) await prisma.backer.delete({ where: { id: b.id } });
  }
}

before(async () => {
  await cleanup();
  const owner = await prisma.backer.create({
    data: { email: OWNER_EMAIL, nickname: "ST Owner", role: "streamer" },
  });
  const fan = await prisma.backer.create({
    data: { email: FAN_EMAIL, nickname: "ST Fan", role: "backer" },
  });
  fanId = fan.id;
  const streamer = await prisma.streamer.create({
    data: {
      handle: HANDLE,
      displayName: `ST ${TOKEN} Creator`,
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
  await prisma.marketplaceItem.deleteMany({ where: { streamerId } });
  await prisma.update.deleteMany({ where: { streamerId } });
  await prisma.block.deleteMany({ where: { streamerId } });
  await prisma.streamer.update({
    where: { id: streamerId },
    data: { status: "approved" },
  });
});

async function newItem(extra: Record<string, unknown> = {}) {
  return prisma.marketplaceItem.create({
    data: {
      streamerId,
      title: `${TOKEN} item`,
      priceMochi: 5,
      itemType: "digital",
      fulfillment: "request",
      ...extra,
    },
  });
}

describe("globalSearch", () => {
  it("finds a creator, an item and a public post in one pass", async () => {
    await newItem();
    await prisma.update.create({
      data: { streamerId, title: `${TOKEN} post`, body: "hi", visibility: "public" },
    });

    const r = await globalSearch(TOKEN);
    assert.equal(r.creators.length, 1);
    assert.equal(r.items.length, 1);
    assert.equal(r.updates.length, 1);
    assert.equal(r.empty, false);
  });

  it("treats a too-short query as no query rather than matching everything", async () => {
    const r = await globalSearch("z".repeat(MIN_QUERY_LENGTH - 1));
    assert.equal(r.empty, true);
    assert.equal(r.creators.length, 0);
  });

  // The one that matters most. A title is content: listing a locked post and
  // marking it locked would hand the headline to exactly the people the
  // visibility setting exists to withhold it from.
  it("never returns a supporter-only post, not even to a supporter", async () => {
    await prisma.update.create({
      data: { streamerId, title: `${TOKEN} secret`, body: "x", visibility: "backers" },
    });
    await prisma.mochiHolding.create({
      data: { streamerId, backerId: fanId, balance: 10, mochiEarnedTotal: 10, krwPaidTotal: 1000 },
    });

    const r = await globalSearch(TOKEN, fanId);
    assert.equal(r.updates.length, 0);
    await prisma.mochiHolding.deleteMany({ where: { streamerId } });
  });

  it("drops everything belonging to a suspended creator", async () => {
    await newItem();
    await prisma.update.create({
      data: { streamerId, title: `${TOKEN} post`, body: "hi", visibility: "public" },
    });
    await prisma.streamer.update({
      where: { id: streamerId },
      data: { status: "suspended" },
    });

    const r = await globalSearch(TOKEN);
    assert.equal(r.creators.length, 0);
    assert.equal(r.items.length, 0);
    assert.equal(r.updates.length, 0);
    assert.equal(r.empty, true);
  });

  it("respects an admin takedown and the creator's own switch", async () => {
    await newItem({ hiddenAt: new Date() });
    await newItem({ active: false, title: `${TOKEN} inactive` });
    const r = await globalSearch(TOKEN);
    assert.equal(r.items.length, 0);
  });

  it("hides a creator the viewer has hidden — and their items and posts with them", async () => {
    await newItem();
    await prisma.update.create({
      data: { streamerId, title: `${TOKEN} post`, body: "hi", visibility: "public" },
    });
    await prisma.block.create({
      data: { backerId: fanId, streamerId, initiator: "fan" },
    });

    const mine = await globalSearch(TOKEN, fanId);
    assert.equal(mine.creators.length, 0);
    assert.equal(mine.items.length, 0, "hiding a creator hides what they sell");
    assert.equal(mine.updates.length, 0);

    // …and only for the fan who hid them.
    const others = await globalSearch(TOKEN);
    assert.equal(others.creators.length, 1);
  });
});
