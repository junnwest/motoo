import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Mochi } from "@/components/Mochi";
import { CreatorCover } from "@/components/CreatorCover";
import { ItemThumbnail } from "@/components/ItemThumbnail";
import { Section } from "@/components/ui/Section";
import {
  IconClock,
  IconSearch,
  IconSend,
  IconTrophy,
  IconWallet,
} from "@/components/ui/Icons";
import { getHoldingsForBacker, getOrdersForBacker } from "@/lib/mochi";
import { getAffordableItems, getUpdatesForBacker } from "@/lib/home";
import { getMyRankings } from "@/lib/ranking";
import { formatKstDate } from "@/lib/format";

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

  const [holdings, rankings, orders, updates, affordable] = await Promise.all([
    getHoldingsForBacker(backerId),
    getMyRankings(backerId),
    getOrdersForBacker(backerId),
    getUpdatesForBacker(backerId),
    getAffordableItems(backerId),
  ]);

  const rankByStreamer = new Map(rankings.map((r) => [r.streamerId, r]));
  const pending = orders.filter((o) => o.status === "pending");
  const hasMochi = holdings.length > 0;

  return (
    <div className="mx-auto max-w-[900px] px-6 py-10 sm:px-10 sm:py-14">
      <h1 className="text-[28px] font-extrabold tracking-[-0.03em] text-ink sm:text-[34px]">
        {t("greeting", { name: nickname })}
      </h1>
      <p className="mt-2 text-[15.5px] text-body">
        {hasMochi ? t("subtitle") : t("subtitleNew")}
      </p>

      <div className="mt-8 flex flex-col gap-9">
        {hasMochi ? (
          <>
            <Section title={t("statusTitle")}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {holdings.map((h) => {
                  const r = rankByStreamer.get(h.streamerId);
                  return (
                    <Link
                      key={h.id}
                      href={`/s/${h.streamer.handle}`}
                      className="flex items-center gap-3 rounded-[16px] bg-card p-4 shadow-soft transition-shadow hover:shadow-card"
                    >
                      <CreatorCover
                        handle={h.streamer.handle}
                        displayName={h.streamer.displayName}
                        className="h-12 w-12 flex-none rounded-full"
                        markClass="text-[18px]"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14.5px] font-bold text-ink">
                          {h.streamer.displayName}
                        </span>
                        <span className="mt-1 flex items-center gap-1.5 text-[13.5px] font-extrabold text-ink">
                          <Mochi width={14} height={11} />
                          {t("balance", { count: h.balance })}
                        </span>
                        {r && (
                          <span className="mt-1 flex items-center gap-1 text-[12px] font-semibold text-coral-deep">
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
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {affordable.map(({ item, streamer, balance }) => (
                    <Link
                      key={item.id}
                      href={`/s/${streamer.handle}#market`}
                      className="flex gap-3 rounded-[16px] bg-card p-4 shadow-soft transition-shadow hover:shadow-card"
                    >
                      <ItemThumbnail
                        thumbnailKey={item.thumbnailKey}
                        itemType={item.itemType}
                        size={46}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14.5px] font-bold text-ink">
                          {item.title}
                        </span>
                        <span className="block truncate text-[12.5px] text-muted">
                          {streamer.displayName}
                        </span>
                        <span className="mt-2 flex items-center gap-1.5 text-[13.5px] font-extrabold text-coral-deep">
                          <Mochi width={14} height={11} />
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

            {pending.length > 0 && (
              <Section title={t("progressTitle", { count: pending.length })}>
                <div className="flex flex-col gap-3">
                  {pending.map((o) => (
                    <div
                      key={o.id}
                      className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[14px] bg-card p-4 shadow-soft"
                    >
                      <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-coral-chip text-coral-deep">
                        <IconClock width={18} height={18} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[15px] font-bold text-ink">
                          {o.item.title}
                        </div>
                        <div className="truncate text-[13px] text-muted">
                          {o.streamer.displayName} · {formatKstDate(o.createdAt)}
                        </div>
                      </div>
                      <span className="flex items-center gap-1.5 text-[14px] font-extrabold text-ink">
                        <Mochi width={15} height={11} />
                        {t("spent", { count: o.mochiSpent })}
                      </span>
                      <span className="rounded-full bg-coral-chip px-2.5 py-1 text-[12px] font-semibold text-coral-deep">
                        {t("statusPending")}
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
                icon={<IconSearch width={20} height={20} />}
                title={t("step1Title")}
                body={t("step1Body")}
              />
              <Step
                icon={<IconSend width={20} height={20} />}
                title={t("step2Title")}
                body={t("step2Body")}
              />
              <Step
                icon={<IconWallet width={20} height={20} />}
                title={t("step3Title")}
                body={t("step3Body")}
              />
            </div>
          </Section>
        )}

        {updates.length > 0 && (
          <Section title={t("newsTitle")}>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {updates.map((u) => (
                <li key={u.id}>
                  <Link
                    href={`/s/${u.streamer.handle}`}
                    className="flex h-full flex-col rounded-[14px] bg-card p-4 shadow-soft transition-shadow hover:shadow-card"
                  >
                    <div className="flex items-center gap-2 text-[13px] text-muted">
                      <span className="font-bold text-ink">
                        {u.streamer.displayName}
                      </span>
                      · {formatKstDate(u.publishedAt)}
                    </div>
                    <div className="mt-1.5 text-[15px] font-bold text-ink">
                      {u.title}
                    </div>
                    <p className="mt-1 line-clamp-2 text-[13.5px] text-body">
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

function Step({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div>
      <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-coral-chip text-coral-deep">
        {icon}
      </span>
      <div className="mt-3 text-[15.5px] font-extrabold text-ink">{title}</div>
      <p className="mt-1 text-[14px] leading-relaxed text-body">{body}</p>
    </div>
  );
}
