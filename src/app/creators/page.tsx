import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { SafetyStrip } from "@/components/SafetyStrip";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { ButtonLink } from "@/components/ui/Button";
import {
  IconUsers,
  IconCheckCircle,
  IconWallet,
  IconTrend,
  IconTag,
  IconAward,
  IconGift,
} from "@/components/ui/Icons";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  const title = t("creators.title");
  const description = t("creators.description");
  return {
    title,
    description,
    alternates: { canonical: "/creators" },
    openGraph: { url: "/creators", title, description },
  };
}
import { Mochi } from "@/components/Mochi";
import { Avatar } from "@/components/ui/Placeholder";

export default async function CreatorLandingPage() {
  const t = await getTranslations("creatorLanding");

  return (
    <>
      <Nav />

      {/* Hero */}
      <section id="main" className="relative overflow-hidden px-6 py-16 sm:px-14 sm:py-[74px]">
        <div className="relative mx-auto grid max-w-[1200px] items-center gap-12 lg:grid-cols-[1.05fr_.95fr]">
          <div>
            <Eyebrow className="mb-[22px]">{t("eyebrow")}</Eyebrow>
            <h1 className="text-5xl font-extrabold leading-tight tracking-[-0.035em] sm:text-7xl">
              {t("heroTitle1")}
              <br />
              {t("heroTitle2")}
              <br />
              <span className="border-b-[5px] border-coral-soft pb-[2px] text-coral-deep">
                {t("heroAccent")}
              </span>
              {t("heroTitleTail")}
            </h1>
            <p className="mt-[26px] max-w-[480px] text-lg leading-relaxed text-body sm:text-xl">
              {t.rich("heroSubtitle", {
                b: (c) => <b className="text-ink">{c}</b>,
              })}
            </p>
            <div className="mt-[34px] flex flex-wrap items-center gap-[14px]">
              <ButtonLink href="/api/become-creator" size="lg">
                {t("ctaApply")} <span>→</span>
              </ButtonLink>
              <ButtonLink href="/explore" variant="secondary" size="lg">
                {t("ctaSample")}
              </ButtonLink>
            </div>
            <div className="mt-[30px] flex flex-wrap items-center gap-[18px] text-xs tracking-[0.02em] text-muted">
              <span className="flex items-center gap-[6px]">
                <span className="h-[7px] w-[7px] rounded-full bg-sage" />
                {t("trustDirect")}
              </span>
              <span>·</span>
              <span>{t("trustNoFunds")}</span>
            </div>
          </div>

          {/* Hero visual: a creator's own mochi market */}
          <div className="relative min-h-[420px]">
            <div className="absolute left-6 right-2 top-8 rotate-[-2deg]">
              <div className="rounded-2xl border border-line-2 bg-white p-6 shadow-float">
                <div className="mb-[18px] flex items-center gap-3">
                  <Avatar name="크리에이터A" size={46} />
                  <div className="flex-1">
                    <div className="text-lg font-extrabold">@크리에이터A</div>
                    <div className="text-2xs text-muted">
                      나의 마켓
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-full bg-coral-chip px-3 py-1.5 text-xs font-bold text-coral-deep">
                    <Mochi width={14} height={11} /> 200원
                  </div>
                </div>
                <div className="flex flex-col gap-2.5">
                  {[
                    { title: "실시간 샤라웃", price: 3 },
                    { title: "멤버 전용 포스트", price: 10 },
                    { title: "노래 신청", price: 5 },
                  ].map((item) => (
                    <div
                      key={item.title}
                      className="flex items-center justify-between rounded-lg border border-line-2 bg-panel px-4 py-3"
                    >
                      <span className="text-sm font-semibold">
                        {item.title}
                      </span>
                      <span className="flex items-center gap-1 text-xs font-bold text-coral-deep">
                        <Mochi width={13} height={10} /> {item.price}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="absolute right-0 top-0 flex animate-[floaty_5s_ease-in-out_infinite] items-center gap-2 rounded-full bg-ink px-[15px] py-[10px] text-sm font-bold text-cream shadow-float">
              <Mochi width={18} height={14} /> +312 응원
            </div>
            <div className="absolute bottom-4 left-0 flex items-center gap-2 rounded-full bg-sage px-[15px] py-[10px] text-sm font-bold text-white shadow-float">
              ✓ 직접 정산
            </div>
          </div>
        </div>
      </section>

      {/* Proof strip */}
      <div className="flex items-center justify-between gap-6 border-y border-line bg-cream-warm-2 px-6 py-[26px] sm:px-14">
        <span className="whitespace-nowrap text-2xs tracking-[0.04em] text-muted">
          {t("proofStrip")}
        </span>
        <div className="flex flex-1 items-center justify-around gap-10 opacity-55">
          {["채널 ◆ 로고", "STUDIO·KR", "버추얼랩", "MCN ❉", "게임존"].map((l) => (
            <span
              key={l}
              className="hidden whitespace-nowrap text-xl font-extrabold tracking-[-0.03em] sm:inline"
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
            <h2 className="text-4xl font-extrabold leading-snug tracking-[-0.03em] text-cream sm:text-5xl">
              {t("insightTitle1")}
              <br />
              <span className="text-coral-tint">{t("insightAccent")}</span>
              {t("insightTitle2")}
            </h2>
            <p className="text-lg leading-relaxed text-dark-text-2">
              {t("insightBody")}
            </p>
          </div>
          <div className="mt-12 grid gap-[18px] md:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="rounded-xl border border-dark-line bg-ink-2 p-6"
              >
                <div className="mb-2 text-base font-bold text-cream">
                  {t(`insight.card${n}Title` as never)}
                </div>
                <div className="text-base leading-relaxed text-dark-text-3">
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
          <h2 className="text-4xl font-extrabold leading-tight tracking-[-0.03em] sm:text-5xl">
            {t("howTitle")}
          </h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { n: 1, right: <span className="flex gap-[6px]"><Mochi width={30} height={24} /><Mochi width={30} height={24} /></span> },
            { n: 2, right: <span className="flex h-9 w-9 items-center justify-center rounded-md bg-coral-chip text-coral-deep"><IconAward width={19} height={19} /></span> },
            { n: 3, right: <span className="flex h-9 w-9 items-center justify-center rounded-md bg-sage-bg text-sage-text"><IconGift width={18} height={18} /></span> },
          ].map((s) => (
            <div
              key={s.n}
              className="rounded-2xl border border-line-2 bg-card p-8 shadow-soft"
            >
              <div className="mb-[22px] flex items-center justify-between">
                <span className="text-sm font-semibold tabular-nums tracking-[0.06em] text-coral-deep">
                  0{s.n}
                </span>
                {s.right}
              </div>
              <h3 className="mb-[10px] text-2xl font-extrabold tracking-[-0.02em]">
                {t(`how.step${s.n}Title` as never)}
              </h3>
              <p className="text-base leading-relaxed text-body">
                {t(`how.step${s.n}Body` as never)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Mochi explainer */}
      <section className="px-6 py-[72px] sm:px-14">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-9 rounded-2xl border border-line-2 bg-card p-11 shadow-soft sm:flex-row">
          <div className="flex flex-none gap-2">
            <Mochi width={58} height={46} />
            <Mochi width={46} height={38} className="self-end" />
          </div>
          <div>
            <h3 className="text-2xl font-extrabold tracking-[-0.02em] sm:text-3xl">
              {t.rich("mochiExplainerTitle", {
                accent: (c) => <span className="text-coral-deep">{c}</span>,
              })}
            </h3>
            <p className="mt-[10px] text-lg leading-relaxed text-body">
              {t("mochiExplainerBody")}
            </p>
          </div>
        </div>
      </section>

      {/* Creator features */}
      <section id="features" className="mx-auto max-w-[1200px] px-6 pb-24 pt-6 sm:px-14">
        <h2 className="mb-9 text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl">
          {t("featuresTitle")}
        </h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {[
            { key: "crm", Icon: IconUsers, tile: "bg-coral-chip text-coral-deep" },
            { key: "perk", Icon: IconCheckCircle, tile: "bg-sage-bg text-sage-text" },
            { key: "payout", Icon: IconWallet, tile: "bg-coral-chip text-coral-deep" },
            { key: "analytics", Icon: IconTrend, tile: "bg-sage-bg text-sage-text" },
            { key: "market", Icon: IconTag, tile: "bg-coral-chip text-coral-deep" },
          ].map((f) => (
            <div key={f.key} className="rounded-xl border border-line-2 bg-card p-6">
              <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-md ${f.tile}`}>
                <f.Icon width={20} height={20} />
              </div>
              <div className="mb-[6px] text-lg font-extrabold">
                {t(`features.${f.key}Title` as never)}
              </div>
              <div className="text-sm leading-normal text-body">
                {t(`features.${f.key}Body` as never)}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonial (dark) */}
      <section className="bg-ink px-6 py-[84px] text-[#F2E9DD] sm:px-14">
        <div className="mx-auto max-w-[880px]">
          <blockquote className="text-3xl font-bold leading-snug tracking-[-0.02em] text-cream sm:text-5xl">
            {t("testimonial")}
          </blockquote>
          <div className="mt-[34px] flex items-center gap-[14px]">
            <Avatar name="크리에이터A" size={52} />
            <div>
              <div className="text-lg font-bold text-cream">
                {t("testimonialName")}
              </div>
              <div className="text-sm text-dark-text-3">
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
          <h2 className="text-4xl font-extrabold leading-tight tracking-[-0.03em] sm:text-6xl">
            {t("finalCtaTitle")}
          </h2>
          <p className="mb-8 mt-[18px] text-lg text-white/85">
            {t("finalCtaBody")}
          </p>
          <div className="flex flex-col items-center justify-center gap-[14px] sm:flex-row">
            <ButtonLink href="/api/become-creator" variant="dark" size="lg">
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
