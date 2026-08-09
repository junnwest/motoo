import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentBacker } from "@/lib/session";

/**
 * Data export — PIPA's right of access. Downloads everything motoo holds about
 * the signed-in account as JSON.
 *
 * A route handler rather than a server action because the result is a file
 * download; actions return values to the client, not attachments.
 *
 * Scoped strictly to the caller's own id. Nothing here takes a parameter, so
 * there is no object to tamper with — the only account it can ever export is
 * the one in the session.
 */
export async function GET() {
  const backer = await getCurrentBacker();
  if (!backer) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const [holdings, orders, follows, notifications] = await Promise.all([
    prisma.mochiHolding.findMany({
      where: { backerId: backer.id },
      include: { streamer: { select: { handle: true, displayName: true } } },
    }),
    prisma.order.findMany({
      where: { backerId: backer.id },
      include: {
        item: { select: { title: true } },
        streamer: { select: { handle: true, displayName: true } },
      },
    }),
    prisma.follow.findMany({
      where: { backerId: backer.id },
      include: { streamer: { select: { handle: true, displayName: true } } },
    }),
    prisma.notification.findMany({ where: { backerId: backer.id } }),
  ]);

  const data = {
    exportedAt: new Date().toISOString(),
    account: {
      email: backer.email,
      nickname: backer.nickname,
      handle: backer.handle,
      createdAt: backer.createdAt,
      onboardedAt: backer.onboardedAt,
      termsAgreedAt: backer.termsAgreedAt,
      marketingConsent: backer.marketingConsent,
      // Identity-verification results are personal data the user is entitled to
      // see. `passwordHash` and `tokenVersion` are deliberately absent: a
      // credential and an internal counter, neither of which is about them.
      verifiedAt: backer.verifiedAt,
      verifiedName: backer.verifiedName,
      birthYear: backer.birthYear,
      gender: backer.gender,
      ageVerified: backer.ageVerified,
      pendingDeletionAt: backer.pendingDeletionAt,
    },
    mochiHoldings: holdings.map((h) => ({
      creator: h.streamer.handle,
      creatorName: h.streamer.displayName,
      balance: h.balance,
      mochiEarnedTotal: h.mochiEarnedTotal,
      krwPaidTotal: h.krwPaidTotal,
      createdAt: h.createdAt,
    })),
    orders: orders.map((o) => ({
      id: o.id,
      creator: o.streamer.handle,
      item: o.item.title,
      mochiSpent: o.mochiSpent,
      quantity: o.quantity,
      note: o.note,
      status: o.status,
      createdAt: o.createdAt,
      fulfilledAt: o.fulfilledAt,
    })),
    following: follows.map((f) => ({
      creator: f.streamer.handle,
      creatorName: f.streamer.displayName,
      since: f.createdAt,
    })),
    notifications: notifications.map((n) => ({
      type: n.type,
      title: n.title,
      body: n.body,
      read: n.read,
      createdAt: n.createdAt,
    })),
  };

  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="motoo-data-${backer.handle ?? backer.id}.json"`,
      // Never let an intermediary hold a copy of someone's personal data.
      "cache-control": "no-store",
    },
  });
}
