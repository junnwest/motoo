import type { Metadata } from "next";
import { getSession } from "@/lib/session";
import { NOINDEX } from "@/lib/metadata";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ConsumerShell } from "@/components/ConsumerShell";
import { Footer } from "@/components/Footer";
import { CreatorCover } from "@/components/CreatorCover";
import { Section } from "@/components/ui/Section";
import { IconTrophy } from "@/components/ui/Icons";
import { getMyRankings } from "@/lib/ranking";
import { ALL_CATEGORIES } from "@/lib/creatorTaxonomy";

/** Signed-in surface: one person’s balances and history. Never indexed. */
export const metadata: Metadata = { robots: NOINDEX };

/**
 * Your rank as a supporter within each creator you hold mochi in — by
 * lifetime purchased, not arrival order (DECISIONS 2026-07-30). Only covers
 * held creators; following alone has no money behind it to rank.
 */
export default async function RankingPage() {
  const session = await getSession();
  if (!session?.user) redirect("/");

  const t = await getTranslations("ranking");
  const tax = await getTranslations("creatorTaxonomy");
  const rankings = await getMyRankings(session.user.id!);
  const sorted = [...rankings].sort((a, b) => a.rank - b.rank);

  return (
    <>
      <ConsumerShell>
        <div className="mx-auto max-w-[900px] px-6 py-12 sm:px-10 sm:py-16">
          <h1 className="text-3xl font-extrabold tracking-[-0.03em] text-ink sm:text-4xl">
            {t("title")}
          </h1>
          <p className="mt-2 text-base text-body">{t("subtitle")}</p>

          <Section className="mt-8">
            {sorted.length === 0 ? (
              <div className="rounded-lg border border-dashed border-line-3 bg-card/60 px-6 py-16 text-center text-base text-muted">
                {t("empty")}
              </div>
            ) : (
              <ul className="flex flex-col gap-3">
                {sorted.map((r) => (
                  <li key={r.streamerId}>
                    <Link
                      href={`/s/${r.handle}`}
                      className="flex items-center gap-4 rounded-lg bg-card p-4 shadow-soft transition-shadow hover:shadow-card"
                    >
                      <CreatorCover
                        handle={r.handle}
                        displayName={r.displayName}
                        className="h-12 w-12 flex-none rounded-full"
                        markClass="text-lg"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-base font-bold text-ink">
                          {r.displayName}
                        </span>
                        <span className="block truncate text-xs text-muted">
                          {ALL_CATEGORIES.includes(r.category)
                            ? tax(`categories.${r.category}`)
                            : r.category}
                        </span>
                      </span>
                      <span className="flex flex-none items-center gap-1.5 rounded-full bg-coral-chip px-3 py-1.5 text-sm font-extrabold text-coral-deep">
                        <IconTrophy width={14} height={14} />
                        {t("rankOf", { rank: r.rank, total: r.totalSupporters })}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>
      </ConsumerShell>
      <Footer variant="fan" />
    </>
  );
}
