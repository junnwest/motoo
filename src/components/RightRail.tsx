import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { CreatorCover } from "@/components/CreatorCover";
import { getHoldingsForBacker } from "@/lib/mochi";
import { getFollowList } from "@/lib/follows";
import { getExploreStreamers } from "@/lib/streamers";
import { ALL_CATEGORIES } from "@/lib/creatorTaxonomy";

/**
 * The persistent right rail — discovery suggestions, mirroring the left
 * Sidebar's "always there" behavior: three independent columns (left nav,
 * middle content that changes per page, right suggestions), all rendered by
 * `ConsumerShell`, none of them page-local. Universal — no per-page
 * exceptions, including a creator's public `/s/[handle]` (that page folded
 * its own Buy Mochi/Report/Updates into its single middle column to make
 * room; see DECISIONS 2026-07-31).
 *
 * Always renders its own shell (border + heading), even with zero
 * candidates — collapsing the column entirely when discovery runs dry would
 * make the right edge flicker in and out exactly like the bug this was meant
 * to fix.
 *
 * Item style matches Spotify's own shelf items (DECISIONS 2026-07-31,
 * corrected): a bare rounded image, caption below, unboxed — no card, no
 * border, no fill.
 */
export async function RightRail({ backerId }: { backerId: string }) {
  const t = await getTranslations("home");
  const tax = await getTranslations("creatorTaxonomy");

  const [holdings, follows] = await Promise.all([
    getHoldingsForBacker(backerId),
    getFollowList(backerId),
  ]);
  const supportedHandles = new Set([
    ...holdings.map((h) => h.streamer.handle),
    ...follows.map((f) => f.handle),
  ]);

  let discover: Awaited<ReturnType<typeof getExploreStreamers>> = [];
  try {
    const trending = await getExploreStreamers({ sort: "readiness" });
    discover = trending.filter((s) => !supportedHandles.has(s.handle)).slice(0, 6);
  } catch {
    discover = [];
  }

  return (
    <aside className="sticky top-16 hidden max-h-[calc(100vh-64px)] w-[300px] flex-none overflow-y-auto border-l border-line px-4 py-6 xl:block">
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <h2 className="text-[15px] font-extrabold tracking-[-0.01em] text-ink">
          {t("discoverTitle")}
        </h2>
        <Link
          href="/explore"
          className="flex-none text-[12.5px] font-bold text-coral-deep hover:underline"
        >
          {t("seeAll")} →
        </Link>
      </div>
      {discover.length === 0 ? (
        <p className="text-[13px] leading-relaxed text-muted">
          {t("discoverEmpty")}
        </p>
      ) : (
        <div className="flex flex-col gap-5">
          {discover.map((s) => (
            <Link key={s.handle} href={`/s/${s.handle}`} className="group block">
              <CreatorCover
                handle={s.handle}
                displayName={s.displayName}
                className="h-[140px] w-full rounded-[12px] transition-opacity group-hover:opacity-90"
                markClass="text-[36px]"
              />
              <div className="mt-2.5">
                <div className="truncate text-[14px] font-extrabold text-ink">
                  {s.displayName}
                </div>
                <div className="mt-0.5 truncate text-[12px] text-muted">
                  {ALL_CATEGORIES.includes(s.category)
                    ? tax(`categories.${s.category}`)
                    : s.category}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </aside>
  );
}
