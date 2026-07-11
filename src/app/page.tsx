import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { SafetyStrip } from "@/components/SafetyStrip";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { ButtonLink } from "@/components/ui/Button";
import { Mochi } from "@/components/Mochi";
import { StreamerCard } from "@/components/StreamerCard";
import { Avatar } from "@/components/ui/Placeholder";
import { GradeBadge } from "@/components/GradeBadge";
import { getExploreStreamers, type StreamerCard as CardData } from "@/lib/streamers";
import { formatCount } from "@/lib/format";

export default async function FanLandingPage() {
  const t = await getTranslations("fanLanding");
  const tc = await getTranslations("common");

  let trending: CardData[] = [];
  try {
    trending = (await getExploreStreamers({ sort: "readiness" })).slice(0, 4);
  } catch {
    trending = [];
  }
  const spotlight = trending[0];

  const categories = ["all", "game", "daily", "music", "virtual", "study"] as const;

  return (
    <>
      <Nav variant="fan" />

      {/* Hero */}
      <section className="relative overflow-hidden bg-cream-warm px-6 py-16 text-center sm:px-14 sm:py-[78px]">
        <Mochi width={64} height={52} float className="absolute left-[8%] top-10" />
        <Mochi
          width={46}
          height={38}
          float
          floatDuration={5}
          floatDelay={0.5}
          className="absolute right-[12%] top-28"
        />
        <Mochi
          width={38}
          height={31}
          float
          floatDuration={7}
          floatDelay={0.2}
          className="absolute bottom-8 left-[16%] hidden sm:block"
        />
        <div className="relative mx-auto max-w-[720px]">
          <Eyebrow className="mb-[22px]">{t("eyebrow")}</Eyebrow>
          <h1 className="text-[38px] font-extrabold leading-[1.12] tracking-[-0.035em] sm:text-[60px]">
            {t("heroTitle")}
            <br />
            <span className="text-coral-deep">{t("heroTitleAccent")}</span>
            {t("heroTitleTail")}
          </h1>
          <p className="mx-auto mt-6 max-w-[520px] text-[17px] leading-[1.6] text-body sm:text-[19px]">
            {t("heroSubtitle")}
          </p>

          {/* Search */}
          <form
            action="/explore"
            className="mx-auto mt-8 flex max-w-[560px] flex-col gap-[10px] sm:flex-row"
          >
            <label className="flex flex-1 items-center gap-[10px] rounded-[15px] border-[1.5px] border-line-3 bg-white px-5 py-[15px] text-left text-[16px] text-muted focus-within:border-coral">
              <span aria-hidden="true">🔍</span>
              <input
                name="q"
                placeholder={t("searchPlaceholder")}
                className="w-full bg-transparent text-ink outline-none placeholder:text-muted"
                aria-label={t("searchPlaceholder")}
              />
            </label>
            <button className="rounded-[15px] bg-coral px-7 py-[15px] text-[16px] font-bold text-white shadow-coral">
              {tc("search")}
            </button>
          </form>

          {/* Category chips */}
          <div className="mt-[18px] flex flex-wrap justify-center gap-[9px]">
            {categories.map((c, i) => (
              <Link
                key={c}
                href={c === "all" ? "/explore" : `/explore?category=${c}`}
                className={`rounded-full px-[18px] py-[9px] text-[14.5px] font-medium ${
                  i === 0
                    ? "bg-ink text-cream"
                    : "border border-line-3 bg-white text-ink hover:border-coral/50"
                }`}
              >
                {t(`categories.${c}` as never)}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Trending creators */}
      <section className="mx-auto max-w-[1200px] px-6 py-20 sm:px-14">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <Eyebrow className="mb-3">{t("trendingEyebrow")}</Eyebrow>
            <h2 className="text-[30px] font-extrabold tracking-[-0.03em] sm:text-[40px]">
              {t("trendingTitle")}
            </h2>
          </div>
          <Link
            href="/explore"
            className="whitespace-nowrap text-[15px] font-semibold text-muted hover:text-ink"
          >
            {tc("seeAll")} →
          </Link>
        </div>
        {trending.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {trending.map((s) => (
              <StreamerCard key={s.handle} streamer={s} />
            ))}
          </div>
        ) : (
          <p className="text-body">{tc("loading")}</p>
        )}
      </section>

      {/* How mochi works (dark) */}
      <section className="bg-ink px-6 py-[88px] text-dark-text sm:px-14">
        <div className="mx-auto max-w-[1200px]">
          <div className="mb-[50px] text-center">
            <Eyebrow tone="onDark" className="mb-4">
              {t("howEyebrow")}
            </Eyebrow>
            <h2 className="text-[32px] font-extrabold tracking-[-0.03em] text-cream sm:text-[42px]">
              {t("howTitle")}
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="rounded-[22px] border border-dark-line bg-ink-2 p-8"
              >
                <div className="mb-[18px] font-mono text-[14px] font-semibold text-coral-tint">
                  0{n}
                </div>
                <h3 className="mb-[10px] text-[22px] font-extrabold text-cream">
                  {t(`how.step${n}Title` as never)}
                </h3>
                <p className="text-[15.5px] leading-[1.6] text-dark-text-3">
                  {t(`how.step${n}Body` as never)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="mx-auto max-w-[1200px] px-6 py-[92px] sm:px-14">
        <h2 className="mb-10 text-center text-[30px] font-extrabold tracking-[-0.03em] sm:text-[40px]">
          {t("benefitsTitle")}
        </h2>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {[
            { key: "message", icon: "💌", bg: "bg-coral-chip" },
            { key: "perks", icon: "🎁", bg: "bg-sage-bg" },
            { key: "badge", icon: "🏅", bg: "bg-coral-chip" },
            { key: "dashboard", icon: "📒", bg: "bg-sage-bg" },
          ].map((b) => (
            <div
              key={b.key}
              className="flex items-start gap-5 rounded-[20px] border border-line-2 bg-card p-8"
            >
              <div
                className={`flex h-12 w-12 flex-none items-center justify-center rounded-[14px] text-[22px] ${b.bg}`}
              >
                {b.icon}
              </div>
              <div>
                <h3 className="mb-[7px] text-[21px] font-extrabold">
                  {t(`benefits.${b.key}Title` as never)}
                </h3>
                <p className="text-[15.5px] leading-[1.6] text-body">
                  {t(`benefits.${b.key}Body` as never)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Spotlight creator */}
      {spotlight && (
        <section className="mx-auto max-w-[1200px] px-6 pb-[92px] sm:px-14">
          <div className="grid grid-cols-1 overflow-hidden rounded-[24px] border border-line-2 bg-card shadow-card md:grid-cols-2">
            <div className="flex min-h-[240px] items-center justify-center bg-sand md:min-h-[340px]">
              <Avatar name={spotlight.displayName} size={120} />
            </div>
            <div className="p-10 sm:p-11">
              <Eyebrow className="mb-4">{t("spotlightEyebrow")}</Eyebrow>
              <h2 className="text-[28px] font-extrabold tracking-[-0.03em] sm:text-[34px]">
                @{spotlight.displayName}
              </h2>
              <div className="mb-7 mt-6 flex gap-7">
                <div>
                  <div className="text-[24px] font-extrabold">
                    {spotlight.backerCount}
                  </div>
                  <div className="text-[13px] text-muted">
                    {t("spotlightBackers")}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-[6px] text-[24px] font-extrabold">
                    <Mochi width={18} height={14} />
                    {formatCount(spotlight.backerCount * 10)}
                  </div>
                  <div className="text-[13px] text-muted">
                    {t("spotlightMochi")}
                  </div>
                </div>
                <div>
                  <GradeBadge grade={spotlight.readiness} size="sm" />
                  <div className="mt-1 text-[13px] text-muted">
                    {t("spotlightTrust")}
                  </div>
                </div>
              </div>
              <ButtonLink href={`/s/${spotlight.handle}#buy-mochi`} size="lg">
                <Mochi width={18} height={14} /> {tc("sendMochi")}
              </ButtonLink>
            </div>
          </div>
        </section>
      )}

      {/* Mochi explainer */}
      <section id="what-is-mochi" className="px-6 pb-20 sm:px-14">
        <div className="mx-auto max-w-[1200px] rounded-[24px] border border-line-2 bg-cream-warm p-11 text-center">
          <div className="mb-[18px] flex justify-center gap-[10px]">
            <Mochi width={44} height={36} />
            <Mochi width={56} height={46} />
            <Mochi width={40} height={33} />
          </div>
          <h3 className="text-[24px] font-extrabold tracking-[-0.02em] sm:text-[28px]">
            {t.rich("mochiExplainerTitle", {
              accent: (c) => <span className="text-coral-deep">{c}</span>,
            })}
          </h3>
          <p className="mx-auto mt-3 max-w-[620px] text-[16.5px] leading-[1.6] text-muted-3">
            {t("mochiExplainerBody")}
          </p>
        </div>
      </section>

      {/* Are you a creator? */}
      <section className="px-6 pb-20 sm:px-14">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-6 rounded-[24px] border border-line-2 bg-ink p-10 text-center sm:flex-row sm:text-left">
          <div>
            <h3 className="text-[24px] font-extrabold text-cream sm:text-[28px]">
              {t("creatorPromptTitle")}
            </h3>
            <p className="mt-2 text-[16px] text-dark-text-2">
              {t("creatorPromptBody")}
            </p>
          </div>
          <ButtonLink href="/creators" variant="primary" size="lg">
            {t("creatorPromptCta")}
          </ButtonLink>
        </div>
      </section>

      <SafetyStrip />

      {/* Final CTA */}
      <section className="relative overflow-hidden bg-coral px-6 py-[92px] text-center text-white sm:px-14">
        <div className="absolute left-[10%] top-8 h-[50px] w-[50px] rounded-[46%_46%_48%_48%/52%_52%_48%_48%] bg-white/20" />
        <div className="absolute bottom-10 right-[14%] h-[64px] w-[64px] rounded-[46%_46%_48%_48%/52%_52%_48%_48%] bg-black/10" />
        <div className="relative">
          <h2 className="text-[34px] font-extrabold leading-[1.16] tracking-[-0.03em] sm:text-[48px]">
            {t("finalCtaTitle")}
          </h2>
          <p className="mb-8 mt-[18px] text-[18px] text-white/85">
            {t("finalCtaBody")}
          </p>
          <div className="flex flex-col items-center justify-center gap-[14px] sm:flex-row">
            <ButtonLink href="/explore" variant="dark" size="lg">
              {t("finalCtaPrimary")}
            </ButtonLink>
            <ButtonLink href="/signup" variant="onCoral" size="lg">
              {tc("signup")}
            </ButtonLink>
          </div>
        </div>
      </section>

      <Footer variant="fan" />
    </>
  );
}
