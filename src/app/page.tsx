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
  IconChevronRight,
  IconLock,
  IconRefund,
  IconWallet,
} from "@/components/ui/Icons";
import { Mochi } from "@/components/Mochi";
import { StreamerCard } from "@/components/StreamerCard";
import {
  getExploreStreamers,
  getLandingStats,
  type StreamerCard as CardData,
  type LandingStats,
} from "@/lib/streamers";
import { getSession } from "@/lib/session";
import { PRELAUNCH } from "@/lib/prelaunch";
import { PrelaunchLanding } from "@/components/PrelaunchLanding";
import { formatCount } from "@/lib/format";

/**
 * The fine grid behind the hero. Pure CSS — no image and no third party, so it
 * costs no request and cannot trip the CSP. Masked to a radial fade so it reads
 * as a surface the page is drawn on rather than as graph paper.
 */
function HeroGrid() {
  const fade =
    "radial-gradient(ellipse 75% 60% at 50% 0%, #000 35%, transparent 100%)";
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
      style={{
        backgroundImage:
          "linear-gradient(to right, var(--color-line) 1px, transparent 1px)," +
          "linear-gradient(to bottom, var(--color-line) 1px, transparent 1px)",
        backgroundSize: "72px 72px",
        maskImage: fade,
        WebkitMaskImage: fade,
      }}
    />
  );
}

/** One figure in the hero stat rail. Tabular so the three do not jitter. */
function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex-1 px-5 py-4 text-center sm:px-7 sm:py-5">
      <div className="text-3xl font-extrabold tabular-nums tracking-[-0.03em] text-ink sm:text-4xl">
        {value}
      </div>
      <div className="mt-1.5 break-keep text-xs tracking-[0.03em] text-muted">
        {label}
      </div>
    </div>
  );
}

/** Founding status for the pre-launch confirmation. One column, one page. */
async function hasFoundingMark(backerId: string | undefined): Promise<boolean> {
  if (!backerId) return false;
  const { prisma } = await import("@/lib/db");
  const row = await prisma.backer.findUnique({
    where: { id: backerId },
    select: { foundingAt: true },
  });
  return Boolean(row?.foundingAt);
}

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

  // Pre-launch: the product is unlaunched for everyone but admins, so `/` is
  // where a signed-in creator lands too — the Studio and /home are gated. They
  // get a confirmation (handle reserved, founding badge) rather than the
  // "only invited creators can sign up" pitch, which would read as a failure to
  // someone who has just been invited and signed up.
  //
  // The marketing landing below is untouched: flipping PRELAUNCH off brings it
  // straight back, which is the point of gating on an env var.
  if (PRELAUNCH && session?.user?.role !== "admin") {
    if (!session?.user) return <PrelaunchLanding />;
    return (
      <PrelaunchLanding
        signedIn={{
          creatorHandle: session.user.creator ?? null,
          founding: await hasFoundingMark(session.user.id),
        }}
      />
    );
  }

  if (session?.user) redirect(session.user.creator ? "/studio" : "/home");

  const t = await getTranslations("fanLanding");
  const tc = await getTranslations("common");
  const ta = await getTranslations("auth");

  let trending: CardData[] = [];
  try {
    trending = (await getExploreStreamers({ sort: "backers", pageSize: 4 }))
      .cards;
  } catch {
    trending = [];
  }

  // Stats are stated as fact on the page, so a failed query renders nothing
  // rather than a zero — "0 크리에이터" is a worse lie than an absent rail.
  let stats: LandingStats | null = null;
  try {
    stats = await getLandingStats();
  } catch {
    stats = null;
  }

  const benefits = [
    {
      Icon: IconSend,
      title: t("benefits.messageTitle"),
      body: t("benefits.messageBody"),
    },
    {
      Icon: IconGift,
      title: t("benefits.perksTitle"),
      body: t("benefits.perksBody"),
    },
    {
      Icon: IconAward,
      title: t("benefits.badgeTitle"),
      body: t("benefits.badgeBody"),
    },
    {
      Icon: IconDashboard,
      title: t("benefits.dashboardTitle"),
      body: t("benefits.dashboardBody"),
    },
  ];

  const steps = [
    { n: "01", title: t("how.step1Title"), body: t("how.step1Body") },
    { n: "02", title: t("how.step2Title"), body: t("how.step2Body") },
    { n: "03", title: t("how.step3Title"), body: t("how.step3Body") },
  ];

  const guarantees = [
    {
      Icon: IconRefund,
      title: t("mochiPoint1Title"),
      body: t("mochiPoint1Body"),
    },
    {
      Icon: IconWallet,
      title: t("mochiPoint2Title"),
      body: t("mochiPoint2Body"),
    },
    {
      Icon: IconLock,
      title: t("mochiPoint3Title"),
      body: t("mochiPoint3Body"),
    },
  ];

  return (
    <>
      <Nav />

      {/* `id="main"` used to sit on the hero <section>, so the skip link had a
          target but the page had no `main` landmark — and everything below the
          hero was outside any landmark at all. Found by `pnpm check:a11y`
          (axe `region`), not by reading it. */}
      <main id="main">
        {/* Hero.
            No colour band. The hero shares the page's white so there is no seam
            under the nav — the old `bg-cream-warm` block was designed against a
            pink page and read as a stray beige rectangle once the page went
            white. Separation now comes from the grid fade and the stat rail. */}
        <section className="relative overflow-hidden px-6 pb-16 pt-16 sm:px-14 sm:pb-20 sm:pt-24">
          <HeroGrid />
          <div className="relative mx-auto max-w-[860px] text-center">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-line-3 bg-card px-3.5 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-coral" />
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-coral-deep">
                {t("eyebrow")}
              </span>
            </div>

            <h1 className="break-keep text-5xl font-extrabold leading-tight tracking-[-0.04em] sm:text-7xl">
              {t("heroTitle")}
              <br />
              <span className="text-coral">{t("heroTitleAccent")}</span>
              {t("heroTitleTail")}
            </h1>

            <p className="mx-auto mt-6 max-w-[540px] break-keep text-lg leading-relaxed text-body sm:text-xl">
              {t("heroSubtitle")}
            </p>

            {/* Both role CTAs go through their route handler so picking one
                clears the other's remembered intent (see /api/fan-signup).
                The creator CTA is `secondary`, not `dark` — filled black, it
                read as equal weight to the fan CTA, which is the one this page
                exists to push. */}
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <ButtonLink href="/api/fan-signup" variant="primary" size="lg">
                {ta("startAsFan")}
              </ButtonLink>
              <ButtonLink
                href="/api/become-creator"
                variant="secondary"
                size="lg"
              >
                {ta("startAsCreator")}
              </ButtonLink>
            </div>

            <p className="mt-5 break-keep text-sm text-muted">{t("heroNote")}</p>
            <p className="mt-2 text-sm text-muted">
              {ta("alreadyMember")}{" "}
              <Link
                href="/login"
                className="font-semibold text-coral-deep hover:underline"
              >
                {tc("login")}
              </Link>
            </p>
          </div>

          {/* Stat rail — real rows from the same tables the product reads. */}
          {stats ? (
            <div className="relative mx-auto mt-14 max-w-[820px] sm:mt-16">
              <div className="flex divide-x divide-line rounded-2xl border border-line-2 bg-card shadow-soft">
                <Stat
                  value={formatCount(stats.creators)}
                  label={t("statsCreators")}
                />
                <Stat
                  value={formatCount(stats.supporters)}
                  label={t("statsSupporters")}
                />
                <Stat
                  value={formatCount(stats.mochiDelivered)}
                  label={t("statsMochi")}
                />
              </div>
              <p className="mt-3 text-center text-2xs tracking-[0.04em] text-muted">
                {t("statsNote")}
              </p>
            </div>
          ) : null}
        </section>

        {/* Trending creators */}
        <section className="mx-auto max-w-[1200px] px-6 py-20 sm:px-14 sm:py-24">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <Eyebrow className="mb-3">{t("trendingEyebrow")}</Eyebrow>
              <h2 className="break-keep text-3xl font-extrabold tracking-[-0.03em] sm:text-5xl">
                {t("trendingTitle")}
              </h2>
            </div>
            <Link
              href="/explore"
              className="inline-flex items-center gap-1 text-sm font-semibold text-coral-deep hover:underline"
            >
              {t("trendingAll")}
              <IconChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {trending.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {trending.map((s, i) => (
                <div key={s.handle} className="relative">
                  {/* Rank marker. Landing-only: it belongs to "지금 뜨는", not to
                      StreamerCard, which is shared with /explore and /search. */}
                  <span className="absolute -top-2.5 left-3 z-10 rounded-md border border-line-2 bg-card px-1.5 py-0.5 text-2xs font-semibold tabular-nums tracking-[0.06em] text-muted">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <StreamerCard streamer={s} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-body">{tc("loading")}</p>
          )}
        </section>

        {/* How it works — the page's single dark block. It used to have two
            plus a dark footer, with a full-bleed orange section wedged between
            them. */}
        <section className="bg-ink px-6 py-20 text-dark-text sm:px-14 sm:py-24">
          <div className="mx-auto max-w-[1200px]">
            <div className="mb-12 text-center">
              <Eyebrow tone="onDark" className="mb-3">
                {t("howEyebrow")}
              </Eyebrow>
              <h2 className="break-keep text-3xl font-extrabold tracking-[-0.03em] text-dark-text sm:text-5xl">
                {t("howTitle")}
              </h2>
            </div>

            <ol className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl bg-dark-line md:grid-cols-3">
              {steps.map((s) => (
                <li key={s.n} className="bg-ink-2 p-8 sm:p-9">
                  <div className="text-sm font-semibold tabular-nums tracking-[0.06em] text-coral-tint">
                    {s.n}
                  </div>
                  <h3 className="mt-5 break-keep text-xl font-bold text-dark-text">
                    {s.title}
                  </h3>
                  <p className="mt-2.5 break-keep text-base leading-relaxed text-dark-text-2">
                    {s.body}
                  </p>
                </li>
              ))}
            </ol>

            <p className="mt-8 break-keep text-center text-sm text-dark-text-3">
              {t("howNote")}
            </p>
          </div>
        </section>

        {/* Benefits */}
        <section className="mx-auto max-w-[1200px] px-6 py-20 sm:px-14 sm:py-24">
          <h2 className="mb-10 break-keep text-3xl font-extrabold tracking-[-0.03em] sm:text-5xl">
            {t("benefitsTitle")}
          </h2>
          <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-line-2 bg-line sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map(({ Icon, title, body }) => (
              <div key={title} className="bg-card p-7">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-coral-chip text-coral-deep">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-5 break-keep text-lg font-bold">{title}</h3>
                <p className="mt-2 break-keep text-base leading-relaxed text-body">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* What mochi is not.
            Legally load-bearing (spec §2 — motoo is not a financial product),
            so it is a precise bordered statement rather than a soft pastel
            band. Every claim here has to agree with /refund, which is the
            single source of truth; the link is not decoration. */}
        <section className="mx-auto max-w-[1200px] px-6 pb-20 sm:px-14 sm:pb-24">
          <div className="overflow-hidden rounded-2xl border border-line-3 bg-card">
            <div className="flex flex-wrap items-center gap-3 border-b border-line-2 bg-panel px-8 py-5">
              {/* `Mochi` writes width/height as inline styles from its props, so a
                  Tailwind `h-4 w-4` on it is silently ignored — this was the one
                  call site of 49 passing className instead of props, and it was
                  rendering at the 26x21 default inside a 28px circle. The tile is
                  also `coral-chip` now: the flattened mochi body is coral-tint,
                  which was invisible against the solid `coral` this used to be. */}
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-coral-chip">
                <Mochi width={18} height={14} className="text-coral-deep" />
              </span>
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-coral-deep">
                {t("mochiExplainerLabel")}
              </span>
            </div>

            <div className="px-8 py-9 sm:px-10">
              <h2 className="max-w-[720px] break-keep text-2xl font-extrabold tracking-[-0.02em] sm:text-4xl">
                {t.rich("mochiExplainerTitle", {
                  accent: (c) => <span className="text-coral">{c}</span>,
                })}
              </h2>

              <div className="mt-9 grid grid-cols-1 gap-8 sm:grid-cols-3">
                {guarantees.map(({ Icon, title, body }) => (
                  <div key={title}>
                    <div className="flex items-center gap-2 text-ink">
                      <Icon className="h-4 w-4 text-coral-deep" />
                      <h3 className="break-keep text-base font-bold">{title}</h3>
                    </div>
                    <p className="mt-2 break-keep text-sm leading-relaxed text-body">
                      {body}
                    </p>
                  </div>
                ))}
              </div>

              <Link
                href="/refund"
                className="mt-9 inline-flex items-center gap-1 text-sm font-semibold text-coral-deep hover:underline"
              >
                {t("mochiExplainerLink")}
                <IconChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        <SafetyStrip />

        {/* Closing CTA.
            Was a full-bleed #ff5722 block sitting between two dark sections —
            the harshest transition on the page, twice over. The orange is the
            button now, which is where it has a job. */}
        <section className="mx-auto max-w-[1200px] px-6 py-20 sm:px-14 sm:py-24">
          <div className="relative overflow-hidden rounded-2xl border border-line-2 bg-card px-8 py-14 text-center shadow-card sm:px-14">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-coral"
            />
            <h2 className="mx-auto max-w-[640px] break-keep text-3xl font-extrabold tracking-[-0.03em] sm:text-5xl">
              {t("finalCtaTitle")}
            </h2>
            <p className="mx-auto mt-4 max-w-[520px] break-keep text-lg leading-relaxed text-body">
              {t("finalCtaBody")}
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <ButtonLink href="/explore" variant="primary" size="lg">
                {t("finalCtaPrimary")}
              </ButtonLink>
              <ButtonLink href="/creators" variant="secondary" size="lg">
                {t("creatorPromptCta")}
              </ButtonLink>
            </div>
            <p className="mt-6 break-keep text-sm text-muted">
              {t("creatorPromptBody")}
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
