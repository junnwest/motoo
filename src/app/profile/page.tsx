import type { Metadata } from "next";
import { NOINDEX } from "@/lib/metadata";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ConsumerShell } from "@/components/ConsumerShell";
import { ButtonLink } from "@/components/ui/Button";
import { Mochi } from "@/components/Mochi";
import { Avatar } from "@/components/ui/Placeholder";
import { CreatorBadge } from "@/components/CreatorBadge";
import { CancelOrderButton } from "@/components/CancelOrderButton";
import { RefundRequestButton } from "@/components/RefundRequestButton";
import { CreatorCover } from "@/components/CreatorCover";
import { IconTrophy } from "@/components/ui/Icons";
import { Section } from "@/components/ui/Section";
import { Pager } from "@/components/Pager";
import { getCurrentBacker, getSession } from "@/lib/session";
import { getHoldingsForBacker, getOrdersForBacker } from "@/lib/mochi";
import { getMyRankings } from "@/lib/ranking";
import { getDonationsWithEligibility } from "@/lib/refunds";
import { formatKstDate } from "@/lib/format";
import { ALL_CATEGORIES } from "@/lib/creatorTaxonomy";

/** Signed-in surface: one person’s balances and history. Never indexed. */
export const metadata: Metadata = { robots: NOINDEX };

const ORDER_STATUS_CHIP: Record<string, string> = {
  pending: "bg-coral-chip text-coral-deep",
  fulfilled: "bg-sage-bg text-sage",
  cancelled: "bg-panel text-muted",
};

/**
 * The signed-in user's own profile (DECISIONS 2026-07-30): identity header +
 * everything that used to live at /me/mochi (holdings, order history), now
 * reached from the avatar dropdown instead of a standalone nav link. /me/mochi
 * redirects here.
 */
export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getSession();
  if (!session?.user) redirect("/");

  const t = await getTranslations("myProfile");
  const tc = await getTranslations("common");
  const tm = await getTranslations("myMochi");
  const tax = await getTranslations("creatorTaxonomy");
  const tr = await getTranslations("ranking");
  const backer = await getCurrentBacker();
  if (!backer) redirect("/api/session-reset");

  // Two independent lists on one page, so they page on their own query keys
  // rather than a shared `?page` that would move both at once.
  const sp = await searchParams;
  const donationPage = Math.max(0, (Number(sp.donations) || 1) - 1);
  const orderPage = Math.max(0, (Number(sp.orders) || 1) - 1);
  const ORDERS_PER_PAGE = 20;
  const DONATIONS_PER_PAGE = 10;

  const [holdings, orderRows, rankings, donations] = await Promise.all([
    getHoldingsForBacker(backer.id),
    // One extra row, dropped below — the same "is there another page" trick the
    // other paged queries use, without a second COUNT.
    getOrdersForBacker(backer.id, {
      skip: orderPage * ORDERS_PER_PAGE,
      take: ORDERS_PER_PAGE + 1,
    }),
    getMyRankings(backer.id),
    getDonationsWithEligibility(
      backer.id,
      DONATIONS_PER_PAGE,
      donationPage * DONATIONS_PER_PAGE,
    ),
  ]);
  const orders = orderRows.slice(0, ORDERS_PER_PAGE);
  const hasMoreOrders = orderRows.length > ORDERS_PER_PAGE;
  const rankByStreamer = new Map(rankings.map((r) => [r.streamerId, r]));

  return (
    <>
      <ConsumerShell>
        <div className="w-full px-6 py-10 sm:px-8 sm:py-12">
          {/* Identity. Accounts are additive, so owning a Studio is the only
              thing that distinguishes a creator — surfaced here (and in the nav
              dropdown) rather than left implicit. */}
          <div className="flex flex-wrap items-center gap-5">
            <Avatar name={backer.nickname} src={backer.avatarUrl} size={72} />
            <div className="min-w-0 flex-1">
              <h1 className="text-3xl font-extrabold tracking-[-0.03em] text-ink sm:text-4xl">
                {backer.nickname}
              </h1>
              {backer.handle && (
                <p className="text-sm text-muted">@{backer.handle}</p>
              )}
              {session.user.creator && (
                <CreatorBadge
                  label={tc("creatorRegistered")}
                  className="mt-2"
                />
              )}
            </div>
            <ButtonLink href="/settings" variant="secondary" size="md">
              {t("editProfile")}
            </ButtonLink>
          </div>

          {/* Holdings */}
          <Section title={tm("holdingsTitle")} className="mt-10">
            {holdings.length === 0 ? (
              <div className="flex flex-col items-center rounded-lg border border-dashed border-line-3 bg-card/60 px-6 py-16 text-center">
                <div className="mb-3 flex items-end justify-center gap-1.5">
                  <Mochi width={38} height={31} float />
                  <Mochi width={50} height={41} float floatDelay={0.5} />
                </div>
                <p className="max-w-[360px] text-base text-body">
                  {tm("empty")}
                </p>
                <ButtonLink
                  href="/explore"
                  variant="dark"
                  size="md"
                  className="mt-6"
                >
                  {tm("exploreCta")}
                </ButtonLink>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-3">
                {holdings.map((h) => (
                  <div
                    key={h.id}
                    className="flex flex-col rounded-lg bg-card p-5 shadow-soft"
                  >
                    <div className="flex items-center gap-3">
                      <CreatorCover
                        handle={h.streamer.handle}
                        displayName={h.streamer.displayName}
                        className="h-11 w-11 flex-none rounded-full"
                        markClass="text-lg"
                      />
                      <div className="min-w-0">
                        <div className="truncate text-base font-extrabold tracking-[-0.02em] text-ink">
                          {h.streamer.displayName}
                        </div>
                        <div className="truncate text-xs text-muted">
                          {ALL_CATEGORIES.includes(h.streamer.category)
                            ? tax(`categories.${h.streamer.category}`)
                            : h.streamer.category}
                        </div>
                      </div>
                    </div>

                    {/* Balance and standing together. Rank used to live only on
                        /ranking — a signed-in, noindex page that rendered the
                        same `getMyRankings` rows as /home and linked to the
                        same place. Profile is where "where do I stand with this
                        creator" belongs, next to what you hold. */}
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-md bg-panel px-4 py-3">
                      <span className="flex items-center gap-1.5 text-base font-extrabold text-ink">
                        <Mochi width={16} height={12} />
                        {tm("balance", { count: h.balance })}
                      </span>
                      {rankByStreamer.get(h.streamerId) && (
                        <span className="flex items-center gap-1 rounded-full bg-coral-chip px-2 py-0.5 text-2xs font-semibold text-coral-deep">
                          <IconTrophy width={12} height={12} />
                          {tr("rankOf", {
                            rank: rankByStreamer.get(h.streamerId)!.rank,
                            total: rankByStreamer.get(h.streamerId)!
                              .totalSupporters,
                          })}
                        </span>
                      )}
                    </div>

                    <ButtonLink
                      href={`/s/${h.streamer.handle}`}
                      variant="secondary"
                      size="md"
                      className="mt-4 w-full"
                    >
                      {tm("visit")}
                    </ButtonLink>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Donation history. Until the ledger landed (2026-08-18) donations
              existed only as running totals, so a fan could see what they held
              but never what they had given — no dates, no receipts, and no way
              to point at the one donation a refund request is about. */}
          <Section title={t("donationsTitle")} className="mt-6" id="donations">
            <p className="-mt-2 mb-4 text-sm text-muted">
              {t("donationsSubtitle")}
            </p>
            {donations.rows.length === 0 ? (
              <div className="rounded-lg border border-dashed border-line-3 bg-card/60 px-6 py-12 text-center text-base text-muted">
                {t("donationsEmpty")}
              </div>
            ) : (
              <ul className="flex flex-col gap-3">
                {donations.rows.map((d) => (
                  <li
                    key={d.id}
                    className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg bg-card p-4 shadow-soft"
                  >
                    <CreatorCover
                      handle={d.streamer.handle}
                      displayName={d.streamer.displayName}
                      className="h-9 w-9 flex-none rounded-full"
                      markClass="text-sm"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-base font-bold text-ink">
                        {d.streamer.displayName}
                      </div>
                      <div className="truncate text-xs text-muted">
                        {formatKstDate(d.createdAt)}
                      </div>
                    </div>
                    <span className="text-sm font-extrabold text-ink">
                      {t("donatedAmount", { amount: d.amountKrw })}
                    </span>
                    <span className="flex items-center gap-1.5 text-sm font-bold text-coral-deep">
                      <Mochi width={15} height={11} />
                      {t("donationBonus", { count: d.mochiGranted })}
                    </span>
                    {/* One request per donation, so once asked the row states
                        where it stands instead of offering to ask again. */}
                    {d.refundedAt ? (
                      <span className="rounded-full bg-panel px-2.5 py-1 text-2xs font-semibold text-muted">
                        {t("refundStatus.refunded")}
                      </span>
                    ) : d.requestStatus ? (
                      <span className="rounded-full bg-panel px-2.5 py-1 text-2xs font-semibold text-muted">
                        {t(`refundStatus.${d.requestStatus}` as never)}
                      </span>
                    ) : (
                      <RefundRequestButton
                        donationId={d.id}
                        creatorName={d.streamer.displayName}
                        amountKrw={d.amountKrw}
                        eligible={d.eligibility.eligible}
                        ineligibleReason={
                          d.eligibility.eligible ? null : d.eligibility.reason
                        }
                      />
                    )}
                  </li>
                ))}
              </ul>
            )}
            <Pager
              basePath="/profile"
              searchParams={sp}
              page={donationPage}
              hasMore={donations.hasMore}
              param="donations"
              anchor="donations"
            />
          </Section>

          {/* Order / redemption history */}
          <Section title={tm("historyTitle")} className="mt-6" id="orders">
            <p className="-mt-2 mb-4 text-sm text-muted">
              {tm("historySubtitle")}
            </p>
            {orders.length === 0 ? (
              <div className="rounded-lg border border-dashed border-line-3 bg-card/60 px-6 py-12 text-center text-base text-muted">
                {tm("historyEmpty")}
              </div>
            ) : (
              <ul className="flex flex-col gap-3">
                {orders.map((o) => (
                  <li
                    key={o.id}
                    className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg bg-card p-4 shadow-soft"
                  >
                    <Avatar
                      name={o.streamer.displayName}
                      src={o.streamer.avatarUrl}
                      size={36}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-base font-bold text-ink">
                        {o.item.title}
                      </div>
                      <div className="truncate text-xs text-muted">
                        {o.streamer.displayName} · {formatKstDate(o.createdAt)}
                      </div>
                    </div>
                    <span className="flex items-center gap-1.5 text-sm font-extrabold text-ink">
                      <Mochi width={15} height={11} />
                      {tm("spent", { count: o.mochiSpent })}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-2xs font-semibold ${
                        ORDER_STATUS_CHIP[o.status] ?? "bg-panel text-muted"
                      }`}
                    >
                      {tm(`orderStatus.${o.status}` as never)}
                    </span>
                    {/* Only a pending order can be taken back — a fulfilled one
                        has already cost the creator the work. */}
                    {o.status === "pending" && (
                      <CancelOrderButton
                        orderId={o.id}
                        itemTitle={o.item.title}
                        mochiSpent={o.mochiSpent}
                      />
                    )}
                  </li>
                ))}
              </ul>
            )}
            <Pager
              basePath="/profile"
              searchParams={sp}
              page={orderPage}
              hasMore={hasMoreOrders}
              param="orders"
              anchor="orders"
            />
          </Section>
        </div>
      </ConsumerShell>
    </>
  );
}
