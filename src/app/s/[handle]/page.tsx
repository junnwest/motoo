import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { ButtonLink } from "@/components/ui/Button";
import { Mochi } from "@/components/Mochi";
import { Avatar } from "@/components/ui/Placeholder";
import { GradeBadge } from "@/components/GradeBadge";
import { BackerWall } from "@/components/BackerWall";
import { getStreamerProfile } from "@/lib/streamers";
import { formatKrw, formatPercent } from "@/lib/format";
import type { Grade } from "@/lib/grades";

export default async function StreamerProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const t = await getTranslations("profile");
  const tc = await getTranslations("common");
  const data = await getStreamerProfile(handle);

  if (!data) {
    return (
      <>
        <Nav variant="fan" />
        <section className="mx-auto flex max-w-[600px] flex-col items-center px-6 py-32 text-center">
          <div className="mb-4 text-[48px]">🔍</div>
          <h1 className="text-[26px] font-extrabold">{t("notFoundTitle")}</h1>
          <p className="mt-3 text-[16px] text-body">{t("notFoundBody")}</p>
          <Link
            href="/explore"
            className="mt-8 rounded-[12px] bg-ink px-5 py-3 text-[14px] font-bold text-cream"
          >
            {t("backToExplore")}
          </Link>
        </section>
        <Footer variant="fan" />
      </>
    );
  }

  const { streamer, tiers, updates, backerWall, report, backerCount } = data;
  const metrics = report?.metrics;
  const grades = report?.grades;

  const platformLinks = [
    { label: "CHZZK", href: streamer.chzzk },
    { label: "SOOP", href: streamer.soop },
    { label: "YouTube", href: streamer.youtube },
    { label: "Twitch", href: streamer.twitch },
    { label: "Discord", href: streamer.discordUrl },
  ].filter((l) => l.href);

  const headlineStats = [
    { value: `${backerCount}`, label: t("backers") },
    {
      value: metrics ? formatPercent(metrics.fanSupport.recurringRate) : "—",
      label: t("recurringRate"),
    },
    {
      value: metrics ? formatPercent(metrics.execution.perkFulfillmentRate) : "—",
      label: t("fulfillment"),
    },
    {
      value: metrics ? `${metrics.fanLoyalty.coreFanCount}` : "—",
      label: t("coreFans"),
    },
  ];

  return (
    <>
      <Nav variant="fan" />

      {/* Header */}
      <section className="border-b border-line bg-cream-warm px-6 py-12 sm:px-14">
        <div className="mx-auto flex max-w-[1100px] flex-col gap-6 sm:flex-row sm:items-center">
          <Avatar name={streamer.displayName} size={92} src={streamer.avatarUrl} />
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-[28px] font-extrabold tracking-[-0.03em] sm:text-[34px]">
                @{streamer.displayName}
              </h1>
              {report && <GradeBadge grade={grades!.sponsorReadiness} size="sm" />}
            </div>
            {streamer.bio && (
              <p className="mt-2 max-w-[560px] text-[15.5px] leading-[1.6] text-body">
                {streamer.bio}
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              {platformLinks.map((l) => (
                <a
                  key={l.label}
                  href={l.href!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-line-3 bg-white px-3 py-[5px] text-[12.5px] font-medium text-muted-2 hover:border-coral/50"
                >
                  {l.label} ↗
                </a>
              ))}
            </div>
          </div>
          <ButtonLink href={`/s/${streamer.handle}/back`} size="lg">
            <Mochi width={18} height={14} /> {tc("backThisStreamer")}
          </ButtonLink>
        </div>

        {/* headline stats */}
        <div className="mx-auto mt-8 grid max-w-[1100px] grid-cols-2 gap-3 sm:grid-cols-4">
          {headlineStats.map((s) => (
            <div
              key={s.label}
              className="rounded-[16px] border border-line-2 bg-card p-4 text-center"
            >
              <div className="text-[26px] font-extrabold tracking-[-0.02em]">
                {s.value}
              </div>
              <div className="text-[13px] text-muted">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="mx-auto grid max-w-[1100px] gap-12 px-6 py-14 sm:px-14 lg:grid-cols-[1.3fr_1fr]">
        {/* Left: tiers + backer wall */}
        <div className="flex flex-col gap-14">
          {/* Tiers */}
          <div>
            <h2 className="mb-5 text-[24px] font-extrabold tracking-[-0.02em]">
              {t("tiersTitle")}
            </h2>
            <div className="flex flex-col gap-4">
              {tiers.map((tier) => (
                <div
                  key={tier.id}
                  className="rounded-[20px] border border-line-2 bg-card p-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-[19px] font-extrabold">{tier.name}</div>
                      {tier.description && (
                        <p className="mt-1 text-[14px] text-body">
                          {tier.description}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-[20px] font-extrabold text-coral-deep">
                        {formatKrw(tier.priceKrw)}
                      </div>
                      <div className="text-[12px] text-muted">
                        {t("tierBackers", { count: tier.backerCount })}
                      </div>
                    </div>
                  </div>
                  {tier.perks.length > 0 && (
                    <ul className="mt-4 flex flex-col gap-2">
                      {tier.perks.map((p) => (
                        <li
                          key={p.id}
                          className="flex items-center gap-2 text-[14px] text-ink"
                        >
                          <span className="flex h-5 w-5 items-center justify-center rounded-[6px] bg-sage-bg text-[11px] text-sage">
                            ✓
                          </span>
                          {p.title}
                        </li>
                      ))}
                    </ul>
                  )}
                  <ButtonLink
                    href={`/s/${streamer.handle}/back?tier=${tier.id}`}
                    variant="secondary"
                    className="mt-5 w-full"
                  >
                    {t("tierBackButton")}
                  </ButtonLink>
                </div>
              ))}
            </div>
          </div>

          {/* Backer Wall */}
          <div>
            <div className="mb-1 flex items-baseline gap-3">
              <h2 className="text-[24px] font-extrabold tracking-[-0.02em]">
                {t("backerWallTitle")}
              </h2>
              <span className="text-[14px] text-muted">
                {t("backerWallSubtitle")}
              </span>
            </div>
            <div className="mt-4">
              <BackerWall entries={backerWall.slice(0, 60)} />
            </div>
          </div>
        </div>

        {/* Right: report summary + updates */}
        <aside className="flex flex-col gap-10">
          {/* Trust Report summary */}
          <div className="rounded-[20px] border border-line-2 bg-card p-6">
            <Eyebrow className="mb-2">{t("reportSummaryTitle")}</Eyebrow>
            {report && grades ? (
              <>
                <p className="mb-4 text-[13px] text-muted">
                  {t("reportSummarySubtitle")}
                </p>
                <div className="mb-4 flex items-center justify-between rounded-[14px] bg-panel p-4">
                  <span className="text-[14px] font-semibold">
                    {t("sponsorReadiness")}
                  </span>
                  <GradeBadge grade={grades.sponsorReadiness} size="sm" />
                </div>
                <ul className="flex flex-col gap-2">
                  {(
                    [
                      ["fanSupport", grades.fanSupport],
                      ["fanLoyalty", grades.fanLoyalty],
                      ["execution", grades.execution],
                      ["growth", grades.growth],
                    ] as [string, Grade][]
                  ).map(([key, grade]) => (
                    <li
                      key={key}
                      className="flex items-center justify-between text-[14px]"
                    >
                      <span className="text-body">{reportAreaLabel(key)}</span>
                      <GradeBadge grade={grade} size="sm" showDot={false} />
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/s/${streamer.handle}/report`}
                  className="mt-5 inline-block text-[14px] font-bold text-coral-deep"
                >
                  {t("viewFullReport")}
                </Link>
              </>
            ) : (
              <p className="text-[14px] text-body">{t("noReport")}</p>
            )}
          </div>

          {/* Updates */}
          <div>
            <h2 className="mb-4 text-[20px] font-extrabold tracking-[-0.02em]">
              {t("updatesTitle")}
            </h2>
            {updates.length === 0 ? (
              <p className="text-[14px] text-body">{t("updatesEmpty")}</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {updates.map((u) => {
                  const locked = u.visibility !== "public";
                  return (
                    <li
                      key={u.id}
                      className="rounded-[16px] border border-line-2 bg-card p-4"
                    >
                      {locked ? (
                        <>
                          <div className="flex items-center gap-2 text-[13px] font-semibold text-muted">
                            🔒 {t("backerOnly")}
                          </div>
                          <p className="mt-1 text-[13.5px] text-body">
                            {t("backerOnlyBody")}
                          </p>
                        </>
                      ) : (
                        <>
                          <div className="text-[15px] font-bold">{u.title}</div>
                          <p className="mt-1 line-clamp-2 text-[13.5px] leading-[1.5] text-body">
                            {u.body}
                          </p>
                        </>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>
      </div>

      <Footer variant="fan" />
    </>
  );
}

function reportAreaLabel(key: string): string {
  const map: Record<string, string> = {
    fanSupport: "팬 서포트",
    fanLoyalty: "팬 충성도",
    execution: "실행력",
    growth: "성장",
  };
  return map[key] ?? key;
}
