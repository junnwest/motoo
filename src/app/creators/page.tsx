import { getTranslations } from "next-intl/server";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { SafetyStrip } from "@/components/SafetyStrip";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { ButtonLink } from "@/components/ui/Button";
import { Mochi } from "@/components/Mochi";
import { Avatar } from "@/components/ui/Placeholder";
import { SampleReportCard, SampleReportBrowser } from "@/components/SampleReport";

export default async function CreatorLandingPage() {
  const t = await getTranslations("creatorLanding");

  return (
    <>
      <Nav variant="creator" />

      {/* Hero */}
      <section className="relative overflow-hidden px-6 py-16 sm:px-14 sm:py-[74px]">
        <div className="pointer-events-none absolute -right-20 -top-28 h-[620px] w-[620px] rounded-full bg-[radial-gradient(circle_at_40%_40%,rgba(240,163,140,.30),rgba(240,163,140,0)_62%)]" />
        <div className="relative mx-auto grid max-w-[1200px] items-center gap-12 lg:grid-cols-[1.05fr_.95fr]">
          <div>
            <Eyebrow className="mb-[22px]">{t("eyebrow")}</Eyebrow>
            <h1 className="text-[42px] font-extrabold leading-[1.1] tracking-[-0.035em] sm:text-[62px]">
              {t("heroTitle1")}
              <br />
              {t("heroTitle2")}
              <br />
              <span className="border-b-[5px] border-coral-soft pb-[2px] text-coral-deep">
                {t("heroAccent")}
              </span>
              {t("heroTitleTail")}
            </h1>
            <p className="mt-[26px] max-w-[480px] text-[18px] leading-[1.62] text-body sm:text-[19px]">
              {t.rich("heroSubtitle", {
                b: (c) => <b className="text-ink">{c}</b>,
              })}
            </p>
            <div className="mt-[34px] flex flex-wrap items-center gap-[14px]">
              <ButtonLink href="/creator/onboarding" size="lg">
                {t("ctaApply")} <span>→</span>
              </ButtonLink>
              <ButtonLink href="/s/creatorA/report" variant="secondary" size="lg">
                {t("ctaSample")}
              </ButtonLink>
            </div>
            <div className="mt-[30px] flex flex-wrap items-center gap-[18px] font-mono text-[12.5px] tracking-[0.02em] text-muted">
              <span className="flex items-center gap-[6px]">
                <span className="h-[7px] w-[7px] rounded-full bg-sage" />
                {t("trustDirect")}
              </span>
              <span>·</span>
              <span>{t("trustNoFunds")}</span>
            </div>
          </div>

          {/* Hero visual: trust report card */}
          <div className="relative min-h-[420px]">
            <div className="absolute left-6 right-2 top-8 rotate-[-2deg]">
              <SampleReportCard />
            </div>
            <div className="absolute right-0 top-0 flex animate-[floaty_5s_ease-in-out_infinite] items-center gap-2 rounded-full bg-ink px-[15px] py-[10px] text-[14px] font-bold text-cream shadow-float">
              <Mochi width={18} height={14} /> +312 응원
            </div>
            <div className="absolute bottom-4 left-0 flex items-center gap-2 rounded-full bg-sage px-[15px] py-[10px] text-[14px] font-bold text-white shadow-float">
              ✓ 스폰서 준비 완료
            </div>
          </div>
        </div>
      </section>

      {/* Proof strip */}
      <div className="flex items-center justify-between gap-6 border-y border-line bg-cream-warm-2 px-6 py-[26px] sm:px-14">
        <span className="whitespace-nowrap font-mono text-[12px] tracking-[0.04em] text-muted">
          {t("proofStrip")}
        </span>
        <div className="flex flex-1 items-center justify-around gap-10 opacity-55">
          {["채널 ◆ 로고", "STUDIO·KR", "버추얼랩", "MCN ❉", "게임존"].map((l) => (
            <span
              key={l}
              className="hidden whitespace-nowrap text-[19px] font-extrabold tracking-[-0.03em] sm:inline"
            >
              {l}
            </span>
          ))}
        </div>
      </div>

      {/* Insight band (dark) */}
      <section className="bg-ink px-6 py-[88px] text-[#F2E9DD] sm:px-14">
        <div className="mx-auto max-w-[1200px]">
          <Eyebrow tone="onDark" className="mb-5">
            {t("insightEyebrow")}
          </Eyebrow>
          <div className="grid items-end gap-14 lg:grid-cols-[1.1fr_1fr]">
            <h2 className="text-[34px] font-extrabold leading-[1.2] tracking-[-0.03em] text-cream sm:text-[44px]">
              {t("insightTitle1")}
              <br />
              <span className="text-coral-tint">{t("insightAccent")}</span>
              {t("insightTitle2")}
            </h2>
            <p className="text-[17px] leading-[1.7] text-dark-text-2">
              {t("insightBody")}
            </p>
          </div>
          <div className="mt-12 grid gap-[18px] md:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="rounded-[18px] border border-dark-line bg-ink-2 p-6"
              >
                <div className="mb-2 text-[15px] font-bold text-cream">
                  {t(`insight.card${n}Title` as never)}
                </div>
                <div className="text-[14.5px] leading-[1.6] text-dark-text-3">
                  {t(`insight.card${n}Body` as never)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-[1200px] px-6 py-24 sm:px-14">
        <div className="mb-[54px] text-center">
          <Eyebrow className="mb-4">{t("howEyebrow")}</Eyebrow>
          <h2 className="text-[34px] font-extrabold leading-[1.14] tracking-[-0.03em] sm:text-[46px]">
            {t("howTitle")}
          </h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { n: 1, right: <span className="flex gap-[6px]"><Mochi width={30} height={24} /><Mochi width={30} height={24} /></span> },
            { n: 2, right: <span className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-coral-chip text-[19px]">🏅</span> },
            { n: 3, right: <span className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-sage-bg text-[18px]">📄</span> },
          ].map((s) => (
            <div
              key={s.n}
              className="rounded-[22px] border border-line-2 bg-card p-8 shadow-soft"
            >
              <div className="mb-[22px] flex items-center justify-between">
                <span className="font-mono text-[14px] font-semibold text-coral-deep">
                  0{s.n}
                </span>
                {s.right}
              </div>
              <h3 className="mb-[10px] text-[23px] font-extrabold tracking-[-0.02em]">
                {t(`how.step${s.n}Title` as never)}
              </h3>
              <p className="text-[16px] leading-[1.6] text-body">
                {t(`how.step${s.n}Body` as never)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Trust report showcase */}
      <section id="report" className="border-t border-line bg-cream-warm px-6 py-[90px] sm:px-14">
        <div className="mx-auto grid max-w-[1200px] items-center gap-12 lg:grid-cols-[.85fr_1.15fr]">
          <div>
            <Eyebrow className="mb-[18px]">{t("reportEyebrow")}</Eyebrow>
            <h2 className="text-[34px] font-extrabold leading-[1.16] tracking-[-0.03em] sm:text-[46px]">
              {t("reportTitle")}
            </h2>
            <p className="mb-[26px] mt-[22px] text-[17.5px] leading-[1.65] text-muted-3">
              {t.rich("reportBody", { b: (c) => <b className="text-ink">{c}</b> })}
            </p>
            <div className="flex flex-col gap-3">
              {["reportBullet1", "reportBullet2", "reportBullet3"].map((k) => (
                <div key={k} className="flex items-center gap-[11px] text-[16px] font-semibold">
                  <span className="flex h-6 w-6 items-center justify-center rounded-[7px] border border-line-3 bg-white text-sage">
                    ✓
                  </span>
                  {t(k as never)}
                </div>
              ))}
            </div>
            <div className="mt-[30px]">
              <ButtonLink href="/s/creatorA/report" variant="dark" size="md">
                {t("reportCta")}
              </ButtonLink>
            </div>
          </div>
          <SampleReportBrowser />
        </div>
      </section>

      {/* Mochi explainer */}
      <section className="px-6 py-[72px] sm:px-14">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-9 rounded-[24px] border border-line-2 bg-card p-11 shadow-soft sm:flex-row">
          <div className="flex flex-none gap-2">
            <Mochi width={58} height={46} />
            <Mochi width={46} height={38} className="self-end" />
          </div>
          <div>
            <h3 className="text-[24px] font-extrabold tracking-[-0.02em] sm:text-[28px]">
              {t.rich("mochiExplainerTitle", {
                accent: (c) => <span className="text-coral-deep">{c}</span>,
              })}
            </h3>
            <p className="mt-[10px] text-[17px] leading-[1.6] text-body">
              {t("mochiExplainerBody")}
            </p>
          </div>
        </div>
      </section>

      {/* Creator features */}
      <section id="features" className="mx-auto max-w-[1200px] px-6 pb-24 pt-6 sm:px-14">
        <h2 className="mb-9 text-[28px] font-extrabold tracking-[-0.03em] sm:text-[34px]">
          {t("featuresTitle")}
        </h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {[
            { key: "crm", icon: "👥", bg: "bg-coral-chip" },
            { key: "perk", icon: "✅", bg: "bg-sage-bg" },
            { key: "payout", icon: "💸", bg: "bg-coral-chip" },
            { key: "analytics", icon: "📈", bg: "bg-sage-bg" },
            { key: "report", icon: "🔗", bg: "bg-coral-chip" },
          ].map((f) => (
            <div key={f.key} className="rounded-[18px] border border-line-2 bg-card p-6">
              <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-[11px] text-[18px] ${f.bg}`}>
                {f.icon}
              </div>
              <div className="mb-[6px] text-[17px] font-extrabold">
                {t(`features.${f.key}Title` as never)}
              </div>
              <div className="text-[13.5px] leading-[1.55] text-body">
                {t(`features.${f.key}Body` as never)}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonial (dark) */}
      <section className="bg-ink px-6 py-[84px] text-[#F2E9DD] sm:px-14">
        <div className="mx-auto max-w-[880px]">
          <blockquote className="text-[30px] font-bold leading-[1.34] tracking-[-0.02em] text-cream sm:text-[46px]">
            {t("testimonial")}
          </blockquote>
          <div className="mt-[34px] flex items-center gap-[14px]">
            <Avatar name="크리에이터A" size={52} />
            <div>
              <div className="text-[17px] font-bold text-cream">
                {t("testimonialName")}
              </div>
              <div className="text-[14px] text-dark-text-3">
                {t("testimonialMeta")}
              </div>
            </div>
          </div>
        </div>
      </section>

      <SafetyStrip bordered={false} />

      {/* Final CTA */}
      <section className="relative overflow-hidden bg-coral px-6 py-24 text-center text-white sm:px-14">
        <div className="absolute -left-10 -top-16 h-[300px] w-[300px] rounded-full bg-white/10" />
        <div className="absolute -bottom-24 -right-8 h-[340px] w-[340px] rounded-full bg-black/[.08]" />
        <div className="relative">
          <h2 className="text-[36px] font-extrabold leading-[1.16] tracking-[-0.03em] sm:text-[50px]">
            {t("finalCtaTitle")}
          </h2>
          <p className="mb-8 mt-[18px] text-[18px] text-white/85">
            {t("finalCtaBody")}
          </p>
          <div className="flex flex-col items-center justify-center gap-[14px] sm:flex-row">
            <ButtonLink href="/creator/onboarding" variant="dark" size="lg">
              {t("ctaApply")} →
            </ButtonLink>
            <ButtonLink href="/" variant="onCoral" size="lg">
              {t("finalCtaFans")}
            </ButtonLink>
          </div>
        </div>
      </section>

      <Footer variant="creator" />
    </>
  );
}
