import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { NOINDEX } from "@/lib/metadata";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { formatKstDate } from "@/lib/format";
import { CreatorRow } from "./CreatorRow";
import { ReportRow } from "./ReportRow";
import { RefundRow } from "./RefundRow";

export const metadata: Metadata = { robots: NOINDEX };

/**
 * The minimal admin console (docs/PRELAUNCH.md #14). Before this the only lever
 * over a bad actor was a SQL client pointed at production.
 *
 * Deliberately small: creators, their status, and suspend/restore. It is not a
 * dashboard, and resisting the urge to make it one is what keeps it shippable —
 * every other moderation surface (items, updates, users) can be added when
 * there is a real case for it rather than a hypothetical one.
 *
 * `force-dynamic` because an admin list served from cache is a list that lies
 * about who is currently suspended.
 */
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdmin(); // 404s for everyone else
  const t = await getTranslations("admin");

  const openReports = await prisma.report.findMany({
    where: { status: "open" },
    orderBy: { createdAt: "asc" }, // oldest first: a queue, not a feed
    take: 100,
    select: {
      id: true,
      targetType: true,
      targetId: true,
      reason: true,
      detail: true,
      createdAt: true,
      reporter: { select: { nickname: true } },
    },
  });

  // Approved requests stay in the queue until the money actually moves — see
  // the section comment below.
  const refundRequests = await prisma.refundRequest.findMany({
    where: { status: { in: ["open", "approved"] } },
    orderBy: { createdAt: "asc" },
    take: 100,
    select: {
      id: true,
      reason: true,
      detail: true,
      eligibleAtRequest: true,
      status: true,
      backer: { select: { nickname: true, email: true } },
      donation: {
        select: {
          amountKrw: true,
          mochiGranted: true,
          createdAt: true,
          streamer: { select: { displayName: true } },
        },
      },
    },
  });

  // Reports store a bare id, because a report has to outlive the thing it is
  // about (deleting an item must not erase the evidence). That means resolving
  // display names is this page's job — two batched lookups rather than a join.
  const reportedCreatorIds = openReports
    .filter((r) => r.targetType === "creator")
    .map((r) => r.targetId);
  const reportedItemIds = openReports
    .filter((r) => r.targetType === "item")
    .map((r) => r.targetId);

  const [reportedCreators, reportedItems] = await Promise.all([
    reportedCreatorIds.length
      ? prisma.streamer.findMany({
          where: { id: { in: reportedCreatorIds } },
          select: { id: true, handle: true, displayName: true },
        })
      : [],
    reportedItemIds.length
      ? prisma.marketplaceItem.findMany({
          where: { id: { in: reportedItemIds } },
          select: { id: true, title: true },
        })
      : [],
  ]);

  const targetLabels = new Map<string, string>([
    ...reportedCreators.map(
      (c) => [`creator:${c.id}`, `${c.displayName} @${c.handle}`] as const,
    ),
    ...reportedItems.map((i) => [`item:${i.id}`, i.title] as const),
  ]);
  const creatorHandles = new Map(reportedCreators.map((c) => [c.id, c.handle]));

  const creators = await prisma.streamer.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 200,
    select: {
      id: true,
      handle: true,
      displayName: true,
      status: true,
      suspendedReason: true,
      suspendedBy: true,
      _count: { select: { mochiHoldings: true } },
    },
  });

  return (
    <>
      <Nav />
      <main id="main" className="mx-auto w-full max-w-[860px] flex-1 px-6 py-12">
        <h1 className="text-3xl font-extrabold tracking-[-0.03em] text-ink">
          {t("title")}
        </h1>
        <p className="mt-2 text-base text-body break-keep">{t("subtitle")}</p>

        {/* Reports first: they are the queue with something waiting in it. The
            creator list is a reference table you consult, not work to do. */}
        <h2 className="mt-8 text-xl font-extrabold text-ink">
          {t("reportsTitle")}
        </h2>
        {openReports.length === 0 ? (
          <p className="mt-2 text-sm text-muted">{t("reportsEmpty")}</p>
        ) : (
          <div className="mt-2">
            {openReports.map((r) => (
              <ReportRow
                key={r.id}
                reportId={r.id}
                targetType={r.targetType}
                targetLabel={targetLabels.get(`${r.targetType}:${r.targetId}`) ?? r.targetId}
                targetHref={
                  r.targetType === "creator"
                    ? (creatorHandles.get(r.targetId) ?? null) &&
                      `/s/${creatorHandles.get(r.targetId)}`
                    : null
                }
                reason={r.reason}
                detail={r.detail}
                reporter={r.reporter.nickname}
                createdAt={formatKstDate(r.createdAt)}
              />
            ))}
          </div>
        )}

        {/* Refunds sit with reports because they are the same kind of thing —
            someone asked motoo to do something and is waiting. Approved ones
            stay in the list: with PAYMENT_PROVIDER=mock, agreeing to refund
            moves no money, so an approval that dropped out of view would be a
            promise nobody could see was outstanding. */}
        <h2 className="mt-10 text-xl font-extrabold text-ink">
          {t("refunds.title")}
        </h2>
        {refundRequests.length === 0 ? (
          <p className="mt-2 text-sm text-muted">{t("refunds.empty")}</p>
        ) : (
          <div className="mt-2">
            {refundRequests.map((r) => (
              <RefundRow
                key={r.id}
                requestId={r.id}
                creatorName={r.donation.streamer.displayName}
                backerLabel={`${r.backer.nickname} · ${r.backer.email}`}
                amountKrw={r.donation.amountKrw}
                mochiGranted={r.donation.mochiGranted}
                donatedAt={formatKstDate(r.donation.createdAt)}
                reason={r.reason}
                detail={r.detail}
                eligibleAtRequest={r.eligibleAtRequest}
                status={r.status as "open" | "approved"}
              />
            ))}
          </div>
        )}

        <h2 className="mt-10 text-xl font-extrabold text-ink">
          {t("creatorsTitle")}
        </h2>
        <div className="mt-2">
          {creators.map((c) => (
            <CreatorRow
              key={c.id}
              streamerId={c.id}
              handle={c.handle}
              displayName={c.displayName}
              status={c.status}
              supporters={c._count.mochiHoldings}
              suspendedReason={c.suspendedReason}
              suspendedBy={c.suspendedBy}
            />
          ))}
        </div>
      </main>
      <Footer variant="fan" />
    </>
  );
}
