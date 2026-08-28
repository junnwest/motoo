import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ConsumerShell } from "@/components/ConsumerShell";
import { Mochi } from "@/components/Mochi";
import { StreamerCard } from "@/components/StreamerCard";
import { ExploreFilters } from "@/components/ExploreFilters";
import { Pager } from "@/components/Pager";
import { getCurrentBacker } from "@/lib/session";
import { getHiddenStreamerIds } from "@/lib/blocks";
import {
  getExploreStreamers,
  type ExploreParams,
  type ExploreSort,
} from "@/lib/streamers";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  const title = t("explore.title");
  const description = t("explore.description");
  return {
    title,
    description,
    alternates: { canonical: "/explore" },
    openGraph: { url: "/explore", title, description },
  };
}

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const t = await getTranslations("explore");
  const sp = await searchParams;

  const params: ExploreParams = {
    q: typeof sp.q === "string" ? sp.q : undefined,
    type: typeof sp.type === "string" ? sp.type : undefined,
    category: typeof sp.category === "string" ? sp.category : undefined,
    backerRange: (typeof sp.backerRange === "string"
      ? sp.backerRange
      : undefined) as ExploreParams["backerRange"],
    sort: (typeof sp.sort === "string" ? sp.sort : "backers") as ExploreSort,
    // Zero-based internally, one-based in the URL — ?page=1 is the first page,
    // because a link that reads page=0 looks like a bug to anyone who sees it.
    page: Math.max(0, (Number(sp.page) || 1) - 1),
  };

  // Hidden creators are dropped in the query, not filtered afterwards, so a
  // hidden creator never eats one of the 60 slots the page loads.
  const viewer = await getCurrentBacker();
  const { cards: streamers, hasMore } = await getExploreStreamers({
    ...params,
    hiddenStreamerIds: viewer ? await getHiddenStreamerIds(viewer.id) : [],
  });

  return (
    <>
      <ConsumerShell>
      <section className="w-full px-6 py-10 sm:px-8 sm:py-12">
        <h1 className="text-3xl font-extrabold tracking-[-0.03em] text-ink sm:text-4xl">
          {t("title")}
        </h1>
        <p className="mt-2 text-base text-body">{t("subtitle")}</p>

        <div className="mt-7">
          <ExploreFilters />
        </div>

        {/* no top-earners leaderboard — ranked by real support, never money raised */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <span className="text-2xs tracking-[0.03em] text-muted">
            {t("rankingNote")}
          </span>
          <span className="text-xs text-muted">
            {/* Counts this page, not the whole result set. A total would need a
                second COUNT over the same filters on every request, to show a
                number nobody acts on — the pager already answers "is there
                more". */}
            {t("resultCount", { count: streamers.length })}
          </span>
        </div>

        {streamers.length > 0 ? (
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {streamers.map((s) => (
              <StreamerCard key={s.handle} streamer={s} />
            ))}
          </div>
        ) : (
          <div className="mt-16 flex flex-col items-center rounded-2xl border border-dashed border-line-3 bg-cream-warm/50 px-6 py-20 text-center">
            <div className="mb-3 flex items-end justify-center gap-1.5">
              <Mochi width={38} height={31} float />
              <Mochi width={50} height={41} float floatDelay={0.5} />
            </div>
            <h2 className="text-xl font-extrabold">{t("empty.title")}</h2>
            <p className="mt-2 max-w-[360px] text-base text-body">
              {t("empty.body")}
            </p>
            <Link
              href="/explore"
              className="mt-6 rounded-md bg-ink px-5 py-3 text-sm font-bold text-cream"
            >
              {t("empty.cta")}
            </Link>
          </div>
        )}
        <Pager
          basePath="/explore"
          searchParams={sp}
          page={params.page ?? 0}
          hasMore={hasMore}
        />
      </section>
      </ConsumerShell>
    </>
  );
}
