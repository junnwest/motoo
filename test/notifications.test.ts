/**
 * Notification preferences (src/lib/notificationPrefs.ts, enforced in notify.ts).
 *
 * The rule that matters is the one that cannot be turned off: `order_cancelled`
 * means mochi went back to someone's balance, and a product that lets you mute
 * that is a product where money moves silently. Everything else here checks the
 * opt-out actually reaches the insert, since a preference the writer ignores is
 * worse than no preference at all.
 */
import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "@/lib/db";
import { notify, notifyMany } from "@/lib/notify";
import { filterByPreference, isMutable } from "@/lib/notificationPrefs";

const A_EMAIL = "notiftest-a@motoo.test";
const B_EMAIL = "notiftest-b@motoo.test";
let aId: string;
let bId: string;

async function cleanup() {
  for (const email of [A_EMAIL, B_EMAIL]) {
    const b = await prisma.backer.findUnique({ where: { email } });
    if (b) await prisma.backer.delete({ where: { id: b.id } }); // cascades both
  }
}

before(async () => {
  await cleanup();
  aId = (
    await prisma.backer.create({
      data: { email: A_EMAIL, nickname: "Notif A", role: "backer" },
    })
  ).id;
  bId = (
    await prisma.backer.create({
      data: { email: B_EMAIL, nickname: "Notif B", role: "backer" },
    })
  ).id;
});

after(async () => {
  await cleanup();
  await prisma.$disconnect();
});

beforeEach(async () => {
  await prisma.notification.deleteMany({
    where: { backerId: { in: [aId, bId] } },
  });
  await prisma.notificationPref.deleteMany({
    where: { backerId: { in: [aId, bId] } },
  });
});

describe("notification preferences", () => {
  it("delivers a mutable type when nothing is opted out of", async () => {
    await notify({ backerId: aId, type: "new_item", title: "t" });
    assert.equal(await prisma.notification.count({ where: { backerId: aId } }), 1);
  });

  it("stops delivery once the type is turned off", async () => {
    await prisma.notificationPref.create({
      data: { backerId: aId, type: "new_item" },
    });
    await notify({ backerId: aId, type: "new_item", title: "t" });
    assert.equal(await prisma.notification.count({ where: { backerId: aId } }), 0);
  });

  it("mutes only the type opted out of", async () => {
    await prisma.notificationPref.create({
      data: { backerId: aId, type: "new_item" },
    });
    await notify({ backerId: aId, type: "new_update", title: "t" });
    assert.equal(await prisma.notification.count({ where: { backerId: aId } }), 1);
  });

  it("applies per person in a batch, not to the whole batch", async () => {
    await prisma.notificationPref.create({
      data: { backerId: aId, type: "new_update" },
    });
    await notifyMany([aId, bId], { type: "new_update", title: "t" });
    assert.equal(await prisma.notification.count({ where: { backerId: aId } }), 0);
    assert.equal(await prisma.notification.count({ where: { backerId: bId } }), 1);
  });

  // The point of the whole design.
  it("cannot mute an order outcome, even with a row saying otherwise", async () => {
    assert.equal(isMutable("order_cancelled"), false);
    // A row that should never exist, written directly to prove the filter does
    // not honour it — the action refuses to create one, and this is the layer
    // underneath that.
    await prisma.notificationPref.create({
      data: { backerId: aId, type: "order_cancelled" },
    });
    const allowed = await filterByPreference([aId], "order_cancelled");
    assert.deepEqual(allowed, [aId]);

    await notify({ backerId: aId, type: "order_cancelled", title: "refunded" });
    assert.equal(await prisma.notification.count({ where: { backerId: aId } }), 1);
  });
});
