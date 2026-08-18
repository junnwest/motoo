import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { SafetyStrip } from "@/components/SafetyStrip";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { ButtonLink } from "@/components/ui/Button";
import {
  IconSend,
  IconGift,
  IconAward,
  IconDashboard,
} from "@/components/ui/Icons";
import { Mochi } from "@/components/Mochi";
import { StreamerCard } from "@/components/StreamerCard";
import { CreatorCover } from "@/components/CreatorCover";
import { getExploreStreamers, type StreamerCard as CardData } from "@/lib/streamers";
import { getSession } from "@/lib/session";
import { getSupporterLeaderboard } from "@/lib/ranking";
import { formatCount } from "@/lib/format";

export default async function FanLandingPage() {
  // "/" is the public marketing landing for logged-OUT visitors only. Everyone
  // signed in is routed to their own landing surface — NOT /explore, which is a
  // browse page and read as a subpage when used as the landing surface
  // (DECISIONS 2026-07-29).
  //
  // A creator (a user who owns a Studio) lands in the **Studio**; a fan lands
  // on /home. `/studio` is forwarded to the studio subdomain by src/proxy.ts,
  // so this is one hop either way. Accounts are still additive — the Studio
  // nav's motoo pill goes straight back to /home, which stays fully reachable.
  // (Non-onboarded users are caught by the onboarding middleware before this.)
  const session = await getSession();
  if (session?.user) redirect(session.user.creator ? "/studio" : "/home");

  const t = await getTranslations("fanLanding");
  const tc = await getTranslations("common");
  const ta = await getTranslations("auth");

  let trending: CardData[] = [];
  try {
    trending = (await getExploreStreamers({ sort: "backers", pageSize: 4 })).cards;
  } catch {
    trending = [];
  }
  const spotlight = trending[0];
  // The spotlight's real lifetime mochi, not a multiple of its supporter count.
  const spotlightMochi = spotlight
    ? (await getSupporterLeaderboard(spotlight.id, 1)).totalMochiEarned
    : 0;

  return (
    <>
      <Nav />

      {/* Hero */}
      <section id="main" className="relative overflow-hidden bg-cream-warm px-6 py-20 text-center sm:px-14 sm:py-24">
        {/* Soft decorative circles (same shape as the final CTA), not floating mochis */}
        <div className="absolute left-[8%] top-10 h-16 w-16 rounded-[46%_46%_48%_48%/52%_52%_48%_48%] bg-coral-soft/45" />
        <div className="absolute right-[12%] top-28 h-11 w-11 rounded-[46%_46%_48%_48%/52%_52%_48%_48%] bg-white/60" />
        <div className="absolute bottom-8 left-[16%] hidden h-9 w-9 rounded-[46%_46%_48%_48%/52%_52%_48%_48%] bg-coral-soft/35 sm:block" />
        <div className="relative mx-auto max-w-[720px]">
          <Eyebrow className="mb-[22px]">{t("eyebrow")}</Eyebrow>
          <h1 className="text-5xl font-extrabold leading-tight tracking-[-0.035em] sm:text-7xl">
            {t("heroTitle")}
            <br />
            <span className="text-coral-deep">{t("heroTitleAccent")}</span>
            {t("heroTitleTail")}
          </h1>
          <p className="mx-auto mt-6 max-w-[520px] text-lg leading-relaxed text-body sm:text-xl">
            {t("heroSubtitle")}
          </p>

          {/* Role CTAs — the choice at first glance (fan vs creator) */}
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            {/* Both role CTAs go through their route handler so picking one
                clears the other's remembered intent (see /api/fan-signup). */}
            <ButtonLink href="/api/fan-signup" variant="primary" size="lg">
              {ta("startAsFan")}
            </ButtonLink>
            <ButtonLink href="/api/become-creator" variant="dark" size="lg">
              {ta("startAsCreator")}
            </ButtonLink>
          </div>
          <p className="mt-4 text-sm text-muted">
            {ta("alreadyMember")}{" "}
            <Link
              href="/login"
              className="font-semibold text-coral-deep hover:underline"
            >
              {tc("login")}
            </Link>
          </p>
        </div>
      </section>

      {/* Trending creators */}
      <section className="mx-auto max-w-[1200px] px-6 py-20 sm:px-14 sm:py-24">
        <div className="mb-8">
          <Eyebrow className="mb-3">{t("trendingEyebrow")}</Eyebrow>
          <h2 className="text-3xl font-extrabold tracking-[-0.03em] sm:text-5xl">
            {t("trendingTitle")}
          </h2>
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
      <section className="bg-ink px-6 py-20 text-dark-text sm:px-14 sm:py-24">
        <div className="mx-auto max-w-[1200px]">
          <div className="mb-[50px] text-center">
            <Eyebrow tone="onDark" className="mb-4">
              {t("howEyebrow")}
            </Eyebrow>
            <h2 className="text-3xl font-extrabold tracking-[-0.03em] text-cream sm:text-5xl">
              {t("howTitle")}
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="rounded-2xl border border-dark-line bg-ink-2 p-8"
              >
                <div className="mb-[18px] font-mono text-sm font-semibold text-coral-tint">
                  0{n}
                </div>
                <h3 className="mb-[10px] text-xl font-extrabold text-cream">
                  {t(`how.step${n}Title` as never)}
                </h3>
                <p className="text-base leading-relaxed text-dark-text-3">
                  {t(`how.step${n}Body` as never)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits. Left-aligned, matching Trending: the rule on this page is
          that sections sitting *on* the page align left, and full-bleed colour
          bands (hero, the dark how-it-works, the final CTA) centre. Before,
          Trending was left and Benefits was centred with nothing distinguishing
          them, which is the kind of near-miss that reads as unconsidered. */}
      <section className="mx-auto max-w-[1200px] px-6 py-20 sm:px-14 sm:py-24">
        <h2 className="mb-10 text-3xl font-extrabold tracking-[-0.03em] sm:text-5xl">
          {t("benefitsTitle")}
        </h2>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {[
            {
              key: "message",
              Icon: IconSend,
              tile: "bg-coral-chip text-coral-deep",
            },
            {
              key: "perks",
              Icon: IconGift,
              tile: "bg-sage-bg text-sage-text",
            },
            {
              key: "badge",
              Icon: IconAward,
              tile: "bg-coral-chip text-coral-deep",
            },
            {
              key: "dashboard",
              Icon: IconDashboard,
              tile: "bg-sage-bg text-sage-text",
            },
          ].map((b) => (
            <div
              key={b.key}
              className="flex items-start gap-5 rounded-xl border border-line-2 bg-card p-8"
            >
              <div
                className={`flex h-12 w-12 flex-none items-center justify-center rounded-lg ${b.tile}`}
              >
                <b.Icon />
              </div>
              <div>
                <h3 className="mb-[7px] text-xl font-extrabold">
                  {t(`benefits.${b.key}Title` as never)}
                </h3>
                <p className="text-base leading-relaxed text-body">
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
          <div className="grid grid-cols-1 overflow-hidden rounded-2xl border border-line-2 bg-card shadow-card md:grid-cols-2">
            <CreatorCover
              handle={spotlight.handle}
              displayName={spotlight.displayName}
              className="min-h-[240px] md:min-h-[340px]"
              markClass="text-[104px] sm:text-[132px]"
            />
            <div className="p-10 sm:p-11">
              <Eyebrow className="mb-4">{t("spotlightEyebrow")}</Eyebrow>
              <h2 className="text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl">
                {spotlight.displayName}
              </h2>
              <div className="mb-7 mt-6 flex gap-7">
                <div>
                  <div className="text-2xl font-extrabold">
                    {spotlight.backerCount}
                  </div>
                  <div className="text-xs text-muted">
                    {t("spotlightBackers")}
                  </div>
                </div>
                <div>
                  {/* Was `backerCount * 10` — an invented number presented as
                      this creator's real mochi total, on the homepage of a
                      product whose whole premise is trustworthy support data.
                      The true figure was one query away. */}
                  <div className="flex items-center gap-[6px] text-2xl font-extrabold">
                    <Mochi width={18} height={14} />
                    {formatCount(spotlightMochi)}
                  </div>
                  <div className="text-xs text-muted">
                    {t("spotlightMochi")}
                  </div>
                </div>
              </div>
              <ButtonLink href={`/s/${spotlight.handle}/donate`} size="lg">
                <Mochi width={18} height={14} /> {tc("donate")}
              </ButtonLink>
            </div>
          </div>
        </section>
      )}

      {/* Mochi explainer — full-bleed, not a boxed card (DECISIONS 2026-08-10: matches
          the Final CTA band below, the one section on this page that already avoided
          the repeated-card look). */}
      <section
        id="what-is-mochi"
        className="bg-cream-warm px-6 py-20 text-center sm:px-14 sm:py-24"
      >
        <div className="mx-auto max-w-[680px]">
          <div className="mb-[18px] flex justify-center gap-[10px]">
            <Mochi width={44} height={36} />
            <Mochi width={56} height={46} />
            <Mochi width={40} height={33} />
          </div>
          <h3 className="text-2xl font-extrabold tracking-[-0.02em] sm:text-3xl">
            {t.rich("mochiExplainerTitle", {
              accent: (c) => <span className="text-coral-deep">{c}</span>,
            })}
          </h3>
          <p className="mx-auto mt-3 max-w-[620px] text-base leading-relaxed text-muted-3">
            {t("mochiExplainerBody")}
          </p>
        </div>
      </section>

      {/* Are you a creator? — full-bleed dark band, same non-boxed treatment. */}
      <section className="bg-ink px-6 py-20 sm:px-14 sm:py-24">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-6 text-center sm:flex-row sm:text-left">
          <div>
            <h3 className="text-2xl font-extrabold text-cream sm:text-3xl">
              {t("creatorPromptTitle")}
            </h3>
            <p className="mt-2 text-base text-dark-text-2">
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
      <section className="relative overflow-hidden bg-coral px-6 py-20 text-center text-white sm:px-14 sm:py-24">
        <div className="absolute left-[10%] top-8 h-[50px] w-[50px] rounded-[46%_46%_48%_48%/52%_52%_48%_48%] bg-white/20" />
        <div className="absolute bottom-10 right-[14%] h-[64px] w-[64px] rounded-[46%_46%_48%_48%/52%_52%_48%_48%] bg-black/10" />
        <div className="relative">
          <h2 className="text-4xl font-extrabold leading-tight tracking-[-0.03em] sm:text-6xl">
            {t("finalCtaTitle")}
          </h2>
          <p className="mb-8 mt-[18px] text-lg text-white/85">
            {t("finalCtaBody")}
          </p>
          <div className="flex justify-center">
            <ButtonLink href="/api/fan-signup" variant="dark" size="lg">
              {tc("signup")}
            </ButtonLink>
          </div>
        </div>
      </section>

      <Footer variant="fan" />
    </>
  );
}
