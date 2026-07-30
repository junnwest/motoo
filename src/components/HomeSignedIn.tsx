import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";
import { Mochi } from "@/components/Mochi";
import { StreamerCard } from "@/components/StreamerCard";
import { CreatorCover } from "@/components/CreatorCover";
import { ItemThumbnail } from "@/components/ItemThumbnail";
import { ButtonLink } from "@/components/ui/Button";
import {
  IconClock,
  IconSearch,
  IconSend,
  IconWallet,
} from "@/components/ui/Icons";
import { getHoldingsForBacker, getOrdersForBacker } from "@/lib/mochi";
import { getAffordableItems, getUpdatesForBacker } from "@/lib/home";
import {
  getExploreStreamers,
  type StreamerCard as CardData,
} from "@/lib/streamers";
import { formatKstDate } from "@/lib/format";
import { ALL_CATEGORIES } from "@/lib/creatorTaxonomy";

/**
 * The signed-in app home, served at `/home`. Adaptive by design
 * (DECISIONS 2026-07-29):
 *
 * - **Holds mochi** → two columns: a sticky rail of the creators they support
 *   (balances, always reachable) beside the main feed — balances, what they can
 *   spend on right now, in-flight orders, news, then discovery.
 * - **Holds nothing** (every new signup) → single column, discovery-led with a
 *   short primer, because the rail and the feed would both be empty on day one.
 *
 * The rail is a **content** rail, not navigation: fan-side has only four
 * destinations, which isn't enough to justify persistent chrome, but "who I
 * support" is real, grows with the user, and is the thing worth keeping onscreen.
 *
 * `/explore` stays the dedicated browse page; this never replaces it.
 */
export async function HomeSignedIn({
  backerId,
  nickname,
}: {
  backerId: string;
  nickname: string;
}) {
  const t = await getTranslations("home");
  const tax = await getTranslations("creatorTaxonomy");

  let trending: CardData[] = [];
  const [holdings, orders, updates, affordable] = await Promise.all([
    getHoldingsForBacker(backerId),
    getOrdersForBacker(backerId),
    getUpdatesForBacker(backerId),
    getAffordableItems(backerId),
  ]);
  try {
    trending = await getExploreStreamers({ sort: "readiness" });
  } catch {
    trending = [];
  }

  const pending = orders.filter((o) => o.status === "pending");
  const hasMochi = holdings.length > 0;
  const totalMochi = holdings.reduce((sum, h) => sum + h.balance, 0);
  // Held creators are already onscreen; don't recommend someone the user is
  // demonstrably already supporting.
  const heldHandles = new Set(holdings.map((h) => h.streamer.handle));
  const discover = trending
    .filter((s) => !heldHandles.has(s.handle))
    .slice(0, hasMochi ? 3 : 8);

  if (!hasMochi) {
    return (
      <>
        <Nav />
        <main className="mx-auto max-w-[1100px] px-6 py-12 sm:px-10 sm:py-16">
          <h1 className="text-[28px] font-extrabold tracking-[-0.03em] text-ink sm:text-[36px]">
            {t("greeting", { name: nickname })}
          </h1>
          <p className="mt-2 text-[16px] text-body">{t("subtitleNew")}</p>

          <div className="mt-9 rounded-[24px] border border-line-2 bg-card p-7 sm:p-9">
            <h2 className="text-[20px] font-extrabold tracking-[-0.02em] text-ink">
              {t("startTitle")}
            </h2>
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
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
          </div>

          {discover.length > 0 && (
            <>
              <SectionHead
                title={t("discoverTitleNew")}
                href="/explore"
                more={t("seeAll")}
              />
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {discover.map((s) => (
                  <StreamerCard key={s.handle} streamer={s} />
                ))}
              </div>
            </>
          )}

          <div className="mt-10 flex justify-center">
            <ButtonLink href="/explore" variant="dark" size="lg">
              {t("browseAll")}
            </ButtonLink>
          </div>
        </main>
        <Footer variant="fan" />
      </>
    );
  }

  return (
    <>
      <Nav />

      <main className="mx-auto max-w-[1440px] px-6 py-10 sm:px-10 sm:py-14">
        <div className="flex flex-col gap-10 lg:flex-row lg:gap-12">
          {/* ── Rail: who you support ──────────────────────────────────── */}
          <aside className="lg:sticky lg:top-24 lg:h-fit lg:w-[276px] lg:flex-none">
            <div className="rounded-[20px] border border-line-2 bg-card p-5">
              <div className="text-[13px] font-bold uppercase tracking-[0.08em] text-muted">
                {t("railTitle")}
              </div>
              <div className="mt-3 flex items-baseline gap-1.5">
                <Mochi width={19} height={15} />
                <span className="text-[26px] font-extrabold tracking-[-0.02em] text-ink">
                  {totalMochi}
                </span>
                <span className="text-[13px] text-muted">
                  {t("railTotal", { count: holdings.length })}
                </span>
              </div>

              <ul className="mt-4 flex flex-col gap-1">
                {holdings.map((h) => (
                  <li key={h.id}>
                    <Link
                      href={`/s/${h.streamer.handle}`}
                      className="flex items-center gap-3 rounded-[12px] px-2 py-2 transition-colors hover:bg-panel"
                    >
                      <CreatorCover
                        handle={h.streamer.handle}
                        displayName={h.streamer.displayName}
                        className="h-9 w-9 flex-none rounded-full"
                        markClass="text-[15px]"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14px] font-bold text-ink">
                          {h.streamer.displayName}
                        </span>
                        <span className="block truncate text-[12px] text-muted">
                          {ALL_CATEGORIES.includes(h.streamer.category)
                            ? tax(`categories.${h.streamer.category}`)
                            : h.streamer.category}
                        </span>
                      </span>
                      <span className="flex-none text-[13px] font-extrabold text-coral-deep">
                        {h.balance}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>

              <Link
                href="/explore"
                className="mt-3 flex items-center justify-center gap-1.5 rounded-[12px] border border-dashed border-line-3 py-2.5 text-[13.5px] font-bold text-muted-2 transition-colors hover:border-coral hover:text-coral-deep"
              >
                <IconSearch width={15} height={15} />
                {t("findMore")}
              </Link>
            </div>

            <Link
              href="/me/mochi"
              className="mt-3 flex items-center justify-between rounded-[16px] border border-line-2 bg-card px-5 py-4 transition-shadow hover:shadow-card"
            >
              <span className="text-[14px] font-bold text-ink">
                {t("orderHistory")}
              </span>
              <span className="text-[13px] font-bold text-coral-deep">→</span>
            </Link>
          </aside>

          {/* ── Feed ───────────────────────────────────────────────────── */}
          <div className="min-w-0 flex-1">
            <h1 className="text-[28px] font-extrabold tracking-[-0.03em] text-ink sm:text-[34px]">
              {t("greeting", { name: nickname })}
            </h1>
            <p className="mt-2 text-[15.5px] text-body">{t("subtitle")}</p>

            {/* Spend: what this balance actually buys, right now. */}
            {affordable.length > 0 && (
              <>
                <SectionHead title={t("affordableTitle")} first />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {affordable.map(({ item, streamer, balance }) => (
                    <Link
                      key={item.id}
                      href={`/s/${streamer.handle}#market`}
                      className="flex gap-3 rounded-[18px] border border-line-2 bg-card p-4 transition-shadow hover:shadow-card"
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
              </>
            )}

            {pending.length > 0 && (
              <>
                <SectionHead
                  title={t("progressTitle", { count: pending.length })}
                  href="/me/mochi"
                  more={t("seeAll")}
                  first={affordable.length === 0}
                />
                <ul className="flex flex-col gap-3">
                  {pending.map((o) => (
                    <li
                      key={o.id}
                      className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[16px] border border-line-2 bg-card p-4"
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
                    </li>
                  ))}
                </ul>
              </>
            )}

            {updates.length > 0 && (
              <>
                <SectionHead title={t("newsTitle")} />
                <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {updates.map((u) => (
                    <li key={u.id}>
                      <Link
                        href={`/s/${u.streamer.handle}`}
                        className="flex h-full flex-col rounded-[16px] border border-line-2 bg-card p-4 transition-shadow hover:shadow-card"
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
              </>
            )}

            {discover.length > 0 && (
              <>
                <SectionHead
                  title={t("discoverTitle")}
                  href="/explore"
                  more={t("seeAll")}
                />
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {discover.map((s) => (
                    <StreamerCard key={s.handle} streamer={s} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      <Footer variant="fan" />
    </>
  );
}

/** Section header with an optional "see all" link on the right. */
function SectionHead({
  title,
  href,
  more,
  first = false,
}: {
  title: string;
  href?: string;
  more?: string;
  first?: boolean;
}) {
  return (
    <div
      className={`mb-4 flex items-baseline justify-between gap-4 ${
        first ? "mt-8" : "mt-12"
      }`}
    >
      <h2 className="text-[19px] font-extrabold tracking-[-0.02em] text-ink sm:text-[21px]">
        {title}
      </h2>
      {href && more && (
        <Link
          href={href}
          className="flex-none text-[13.5px] font-bold text-coral-deep hover:underline"
        >
          {more} →
        </Link>
      )}
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
