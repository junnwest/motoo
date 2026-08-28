import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Mochi } from "@/components/Mochi";
import { CreatorCover } from "@/components/CreatorCover";
import { ItemThumbnail } from "@/components/ItemThumbnail";
import { Section } from "@/components/ui/Section";
import {
  IconCheckCircle,
  IconClock,
  IconSearch,
  IconSend,
  IconTrophy,
  IconWallet,
} from "@/components/ui/Icons";
import { getHoldingsForBacker, getOrdersForBacker } from "@/lib/mochi";
import {
  getAffordableItems,
  getOutOfReachItems,
  getUpdatesForBacker,
} from "@/lib/home";
import { getMyRankings } from "@/lib/ranking";
import { formatCount, formatKstDate } from "@/lib/format";

/**
 * The signed-in app home's own content — a single column now. Nav, the left
 * Sidebar (홈/둘러보기 + following), and the right RightRail (discovery
 * suggestions) are all app-wide chrome from ConsumerShell; this component
 * used to render its own right-hand suggestion column too, but that was a
 * page-local copy of what's now a persistent rail everywhere else — moved
 * out so there's exactly one discover surface, not two (DECISIONS 2026-07-31:
 * three independent columns, only the middle changes per page).
 *
 * **Mochi status** (default view): per-creator balance and rank
 * (`src/lib/ranking.ts`, lifetime purchased, not arrival order), then what
 * you can spend on right now, in-flight orders, and news from creators you
 * hold mochi in.
 *
 * Adaptive: **holds no mochi anywhere** → falls back to a short how-it-works
 * primer instead of the status column — there's nothing money-shaped to show
 * yet. News still renders below it regardless (`getUpdatesForBacker` already
 * unions held + followed creators), so a follow-only user isn't starved of
 * updates just because the status card doesn't apply to them.
 *
 * Item cards follow Spotify's own treatment (DECISIONS 2026-07-31, corrected
 * against a real logged-in screenshot): a flat `bg-card` fill with **no
 * border** — a soft shadow does the separating, the way Spotify's own
 * "recently played" pills have a fill but no stroke.
 */
export async function HomeSignedIn({
  backerId,
  nickname,
}: {
  backerId: string;
  nickname: string;
}) {
  const t = await getTranslations("home");
  const tr = await getTranslations("ranking");

  const [holdings, rankings, orders, updates, affordable, outOfReach, recent] =
    await Promise.all([
      getHoldingsForBacker(backerId),
      getMyRankings(backerId),
      // Only the pending ones are rendered; asking for them narrows the query
      // instead of fetching every order this user has ever placed and filtering.
      getOrdersForBacker(backerId, { status: "pending", take: 20 }),
      getUpdatesForBacker(backerId),
      getAffordableItems(backerId),
      getOutOfReachItems(backerId),
      // Settled orders, for the history section. A separate narrow query rather
      // than widening the one above and filtering twice in memory.
      getOrdersForBacker(backerId, { status: "fulfilled", take: 5 }),
    ]);

  const rankByStreamer = new Map(rankings.map((r) => [r.streamerId, r]));
  const pending = orders.filter((o) => o.status === "pending");
  const hasMochi = holdings.length > 0;
  // Aggregations, not queries — everything here is already loaded above.
  const totalMochi = holdings.reduce((sum, h) => sum + h.balance, 0);

  return (
    <div className="w-full px-6 py-10 sm:px-8 sm:py-12">
      <h1 className="text-3xl font-extrabold tracking-[-0.03em] text-ink sm:text-4xl">
        {t("greeting", { name: nickname })}
      </h1>
      <p className="mt-2 text-base text-body">
        {hasMochi ? t("subtitle") : t("subtitleNew")}
      </p>

      {/* Summary strip. Pure aggregation of what this page already loads — no
          extra queries — and it gives the column a headline that uses the full
          width instead of starting straight into cards. */}
      {hasMochi && (
        <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
          <SummaryTile
            label={t("summaryMochi")}
            value={
              <span className="flex items-center gap-1.5">
                <Mochi width={18} height={14} className="text-coral-deep" />
                {formatCount(totalMochi)}
              </span>
            }
          />
          <SummaryTile
            label={t("summaryCreators")}
            value={t("summaryUnit", { count: holdings.length })}
          />
          <SummaryTile
            label={t("summaryPending")}
            value={t("summaryCount", { count: pending.length })}
          />
        </div>
      )}

      <div className="mt-8 flex flex-col gap-9">
        {hasMochi ? (
          <>
            <Section title={t("statusTitle")}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-3">
                {holdings.map((h) => {
                  const r = rankByStreamer.get(h.streamerId);
                  return (
                    // The one section on this page that earns elevation. Your
                    // balance and rank are why you came back; an item you could
                    // afford and a news post are not peers of it, and until now
                    // all three rendered as the same 4px-padded white pill.
                    <Link
                      key={h.id}
                      href={`/s/${h.streamer.handle}`}
                      className="flex items-center gap-4 rounded-xl bg-card p-5 shadow-card transition-transform duration-swift ease-out-soft hover:-translate-y-0.5"
                    >
                      <CreatorCover
                        handle={h.streamer.handle}
                        displayName={h.streamer.displayName}
                        className="h-14 w-14 flex-none rounded-full"
                        markClass="text-xl"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-muted-2">
                          {h.streamer.displayName}
                        </span>
                        {/* The number is the point of the card, so it reads at
                            heading scale rather than as another 14px line. */}
                        <span className="mt-0.5 flex items-baseline gap-1.5 text-xl font-extrabold tracking-[-0.02em] text-ink">
                          <Mochi width={17} height={13} className="text-coral-deep" />
                          {t("balance", { count: h.balance })}
                        </span>
                        {r && (
                          <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-coral-chip px-2 py-0.5 text-2xs font-semibold text-coral-deep">
                            <IconTrophy width={12} height={12} />
                            {tr("rankOf", {
                              rank: r.rank,
                              total: r.totalSupporters,
                            })}
                          </span>
                        )}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </Section>

            {/* Spend: what this balance actually buys, right now. */}
            {affordable.length > 0 && (
              <Section title={t("affordableTitle")}>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-3">
                  {affordable.map(({ item, streamer, balance }) => (
                    // Flat, bordered, no shadow — one step below the balance
                    // cards above, which is the whole point of the distinction.
                    <Link
                      key={item.id}
                      href={`/s/${streamer.handle}#market`}
                      className="flex gap-3 rounded-lg border border-line-2 bg-card p-4 transition-colors duration-swift hover:border-coral/40"
                    >
                      <ItemThumbnail
                        thumbnailKey={item.thumbnailKey}
                        itemType={item.itemType}
                        size={46}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-base font-bold text-ink">
                          {item.title}
                        </span>
                        <span className="block truncate text-xs text-muted">
                          {streamer.displayName}
                        </span>
                        <span className="mt-2 flex items-center gap-1.5 text-sm font-extrabold text-coral-deep">
                          <Mochi width={14} height={11} className="text-coral-deep" />
                          {t("itemPrice", { count: item.priceMochi })}
                          <span className="font-medium text-muted">
                            {t("ofBalance", { count: balance })}
                          </span>
                        </span>
                      </span>
                    </Link>
                  ))}
                </div>
              </Section>
            )}

            {/* The mirror of the section above: what the balance does *not*
                reach yet, closest first. It is the one section on this page
                that gives a reason to donate again, which is why it sits
                directly under what you can already afford. */}
            {outOfReach.length > 0 && (
              <Section title={t("reachTitle")}>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-3">
                  {outOfReach.map(({ item, streamer, shortfall }) => (
                    <Link
                      key={item.id}
                      href={`/s/${streamer.handle}/donate`}
                      className="flex gap-3 rounded-lg border border-dashed border-line-3 p-4 transition-colors duration-swift hover:border-coral/50"
                    >
                      <ItemThumbnail
                        thumbnailKey={item.thumbnailKey}
                        itemType={item.itemType}
                        size={46}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-base font-bold text-ink">
                          {item.title}
                        </span>
                        <span className="block truncate text-xs text-muted">
                          {streamer.displayName}
                        </span>
                        <span className="mt-2 flex items-center gap-1.5 text-sm font-extrabold text-coral-deep">
                          <Mochi width={14} height={11} className="text-coral-deep" />
                          {t("reachShort", { count: shortfall })}
                        </span>
                      </span>
                    </Link>
                  ))}
                </div>
              </Section>
            )}

            {pending.length > 0 && (
              <Section title={t("progressTitle", { count: pending.length })}>
                {/* Status lines, not objects. A pending order is something you
                    check, not something you act on, so it reads as a list with
                    hairlines rather than another stack of white pills. */}
                <div className="divide-y divide-line-2 border-y border-line-2">
                  {pending.map((o) => (
                    <div
                      key={o.id}
                      className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3.5"
                    >
                      <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-coral-chip text-coral-deep">
                        <IconClock width={18} height={18} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-base font-bold text-ink">
                          {o.item.title}
                        </div>
                        <div className="truncate text-xs text-muted">
                          {o.streamer.displayName} · {formatKstDate(o.createdAt)}
                        </div>
                      </div>
                      <span className="flex items-center gap-1.5 text-sm font-extrabold text-ink">
                        <Mochi width={15} height={11} className="text-coral-deep" />
                        {t("spent", { count: o.mochiSpent })}
                      </span>
                      <span className="rounded-full bg-coral-chip px-2.5 py-1 text-2xs font-semibold text-coral-deep">
                        {t("statusPending")}
                      </span>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Settled orders. Same row treatment as pending — these are also
                things you check rather than act on — but in sage, so a glance
                separates "waiting on the creator" from "done". */}
            {recent.length > 0 && (
              <Section title={t("historyTitle")}>
                <div className="divide-y divide-line-2 border-y border-line-2">
                  {recent.map((o) => (
                    <div
                      key={o.id}
                      className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3.5"
                    >
                      <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-sage-bg text-sage">
                        <IconCheckCircle width={18} height={18} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-base font-bold text-ink">
                          {o.item.title}
                        </div>
                        <div className="truncate text-xs text-muted">
                          {o.streamer.displayName} · {formatKstDate(o.createdAt)}
                        </div>
                      </div>
                      <span className="flex items-center gap-1.5 text-sm font-extrabold text-ink">
                        <Mochi width={15} height={11} className="text-coral-deep" />
                        {t("spent", { count: o.mochiSpent })}
                      </span>
                      <span className="rounded-full bg-sage-bg px-2.5 py-1 text-2xs font-semibold text-sage">
                        {t("statusFulfilled")}
                      </span>
                    </div>
                  ))}
                </div>
              </Section>
            )}
          </>
        ) : (
          <Section title={t("startTitle")}>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <Step
                href="/explore"
                icon={<IconSearch width={20} height={20} />}
                title={t("step1Title")}
                body={t("step1Body")}
              />
              <Step
                href="/explore"
                icon={<IconSend width={20} height={20} />}
                title={t("step2Title")}
                body={t("step2Body")}
              />
              <Step
                href="/explore"
                icon={<IconWallet width={20} height={20} />}
                title={t("step3Title")}
                body={t("step3Body")}
              />
            </div>
          </Section>
        )}

        {updates.length > 0 && (
          <Section title={t("newsTitle")}>
            {/* A feed, so it reads as one — the page used to end in eight more
                white pills, which is what made the whole column look like a
                dump of identical boxes however good each box was. */}
            {/* Two columns once the box is wide, rather than one list running
                the full 1350px. Filling the width is the goal, but a paragraph
                that wide is a worse read than the whitespace it replaced —
                columns use the space *and* keep the line length sane. Hairlines
                move to each item (`border-b`) instead of `divide-y`, which
                would draw them across the gap between columns. */}
            <ul className="border-t border-line-2 2xl:grid 2xl:grid-cols-2 2xl:gap-x-10">
              {updates.map((u) => (
                <li key={u.id} className="border-b border-line-2">
                  <Link
                    href={`/s/${u.streamer.handle}`}
                    className="group flex h-full flex-col py-4 transition-colors duration-swift"
                  >
                    <div className="flex items-center gap-2 text-xs text-muted">
                      <span className="font-bold text-ink">
                        {u.streamer.displayName}
                      </span>
                      · {formatKstDate(u.publishedAt)}
                    </div>
                    <div className="mt-1.5 text-base font-bold text-ink break-keep group-hover:text-coral-deep">
                      {u.title}
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm leading-normal text-body">
                      {u.body}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </Section>
        )}
      </div>
    </div>
  );
}

/**
 * One step of the zero-holdings primer, and a real entry point — every step is
 * a link, not decoration. With no mochi held anywhere, all three steps (find a
 * creator → send mochi → spend it in their market) start in the same place, so
 * they all lead to /explore; the icon reads as the affordance, hence the hover
 * lift on the tile and the arrow on the title.
 */
function Step({
  href,
  icon,
  title,
  body,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <Link href={href} className="group block rounded-md">
      <span className="flex h-10 w-10 items-center justify-center rounded-md bg-coral-chip text-coral-deep transition group-hover:bg-coral group-hover:text-white">
        {icon}
      </span>
      <div className="mt-3 flex items-center gap-1 text-base font-extrabold text-ink">
        {title}
        <span
          aria-hidden="true"
          className="text-coral-deep opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100"
        >
          →
        </span>
      </div>
      <p className="mt-1 text-sm leading-relaxed text-body">{body}</p>
    </Link>
  );
}

/**
 * One figure from the summary strip. A tile, not a card: no shadow, no border —
 * the strip is a readout, and giving each number a card would put three more
 * boxes above a page that already earns its boxes elsewhere.
 */
function SummaryTile({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-lg bg-card px-5 py-4">
      <div className="text-xs font-semibold text-muted-2">{label}</div>
      <div className="mt-1 text-xl font-extrabold tracking-[-0.02em] text-ink">
        {value}
      </div>
    </div>
  );
}
