import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { StreamerCard } from "@/components/StreamerCard";
import { ExploreFilters } from "@/components/ExploreFilters";
import {
  getExploreStreamers,
  type ExploreParams,
  type ExploreSort,
} from "@/lib/streamers";

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const t = await getTranslations("explore");
  const sp = await searchParams;

  const params: ExploreParams = {
    q: typeof sp.q === "string" ? sp.q : undefined,
    category: typeof sp.category === "string" ? sp.category : undefined,
    backerRange: (typeof sp.backerRange === "string"
      ? sp.backerRange
      : undefined) as ExploreParams["backerRange"],
    sort: (typeof sp.sort === "string" ? sp.sort : "readiness") as ExploreSort,
  };

  const streamers = await getExploreStreamers(params);

  return (
    <>
      <Nav variant="fan" />

      <section className="mx-auto max-w-[1200px] px-6 py-12 sm:px-14">
        <Eyebrow className="mb-3">{t("eyebrow")}</Eyebrow>
        <h1 className="text-[32px] font-extrabold tracking-[-0.03em] sm:text-[40px]">
          {t("title")}
        </h1>
        <p className="mt-2 max-w-[560px] text-[16px] text-body">{t("subtitle")}</p>

        <div className="mt-7">
          <ExploreFilters />
        </div>

        {/* trust-signal ranking note — no top-earners leaderboard */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <span className="font-mono text-[12px] tracking-[0.03em] text-muted">
            {t("readinessNote")}
          </span>
          <span className="text-[13px] text-muted">
            {t("resultCount", { count: streamers.length })}
          </span>
        </div>

        {streamers.length > 0 ? (
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {streamers.map((s) => (
              <StreamerCard key={s.handle} streamer={s} />
            ))}
          </div>
        ) : (
          <div className="mt-16 flex flex-col items-center rounded-[24px] border border-dashed border-line-3 bg-cream-warm/50 px-6 py-20 text-center">
            <div className="mb-3 text-[40px]">🍡</div>
            <h2 className="text-[20px] font-extrabold">{t("empty.title")}</h2>
            <p className="mt-2 max-w-[360px] text-[15px] text-body">
              {t("empty.body")}
            </p>
            <Link
              href="/explore"
              className="mt-6 rounded-[12px] bg-ink px-5 py-3 text-[14px] font-bold text-cream"
            >
              {t("empty.cta")}
            </Link>
          </div>
        )}
      </section>

      <Footer variant="fan" />
    </>
  );
}
