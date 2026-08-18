import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { NOINDEX } from "@/lib/metadata";
import { ConsumerShell } from "@/components/ConsumerShell";
import { Section } from "@/components/ui/Section";
import { Avatar } from "@/components/ui/Placeholder";
import { Mochi } from "@/components/Mochi";
import { SearchBox } from "@/components/SearchBox";
import { getCurrentBacker } from "@/lib/session";
import { globalSearch, MIN_QUERY_LENGTH } from "@/lib/search";
import { formatKstDate } from "@/lib/format";
import { ALL_CATEGORIES } from "@/lib/creatorTaxonomy";

/**
 * A results page for one person's query — nothing here is a stable URL worth
 * indexing, and a crawler working through the query space would run three
 * `contains` scans per request.
 */
export const metadata: Metadata = { robots: NOINDEX };

/**
 * Global search across creators, items and updates (docs/PRELAUNCH.md #27).
 * The rules — what is excluded and why supporter-only posts never appear — live
 * in `src/lib/search.ts`.
 */
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const t = await getTranslations("search");
  const tax = await getTranslations("creatorTaxonomy");
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";

  const viewer = await getCurrentBacker();
  const results = await globalSearch(q, viewer?.id);
  const tooShort = q.trim().length > 0 && q.trim().length < MIN_QUERY_LENGTH;

  return (
    <>
      <ConsumerShell>
        <div className="w-full px-6 py-10 sm:px-8 sm:py-12">
          <h1 className="text-3xl font-extrabold tracking-[-0.03em] text-ink sm:text-4xl">
            {t("title")}
          </h1>
          <div className="mt-6 max-w-[520px]">
            <SearchBox defaultValue={q} autoFocus />
          </div>

          {tooShort && (
            <p className="mt-6 text-base text-muted break-keep">
              {t("tooShort", { min: MIN_QUERY_LENGTH })}
            </p>
          )}

          {q.trim().length >= MIN_QUERY_LENGTH && results.empty && (
            <div className="mt-12 flex flex-col items-center rounded-2xl border border-dashed border-line-3 bg-cream-warm/50 px-6 py-16 text-center">
              <div className="mb-3 flex items-end justify-center gap-1.5">
                <Mochi width={38} height={31} float />
                <Mochi width={50} height={41} float floatDelay={0.5} />
              </div>
              <h2 className="text-xl font-extrabold break-keep">
                {t("empty.title", { q: q.trim() })}
              </h2>
              <p className="mt-2 max-w-[360px] text-base text-body break-keep">
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

          {/* Creators first: the query is most often a name, and a creator is
              the only result that leads everywhere else. */}
          {results.creators.length > 0 && (
            <Section title={t("creators")} className="mt-10">
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {results.creators.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/s/${c.handle}`}
                      className="flex items-center gap-3 rounded-lg bg-card p-4 shadow-soft transition-colors hover:bg-cream-warm"
                    >
                      <Avatar name={c.displayName} src={c.avatarUrl} size={40} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-base font-extrabold tracking-[-0.02em] text-ink">
                          {c.displayName}
                        </div>
                        <div className="truncate text-xs text-muted">
                          @{c.handle} ·{" "}
                          {ALL_CATEGORIES.includes(c.category)
                            ? tax(`categories.${c.category}`)
                            : c.category}
                        </div>
                      </div>
                      <span className="flex-none text-xs text-muted">
                        {t("supporters", { count: c.supporters })}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {results.items.length > 0 && (
            <Section title={t("items")} className="mt-8">
              <ul className="flex flex-col gap-2">
                {results.items.map((i) => (
                  <li key={i.id}>
                    <Link
                      href={`/s/${i.handle}`}
                      className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg bg-card p-4 shadow-soft transition-colors hover:bg-cream-warm"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-base font-bold text-ink">
                          {i.title}
                        </div>
                        <div className="truncate text-xs text-muted">
                          {i.creatorName}
                        </div>
                      </div>
                      <span className="flex flex-none items-center gap-1.5 text-sm font-extrabold text-ink">
                        <Mochi width={15} height={11} />
                        {t("price", { count: i.priceMochi })}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {results.updates.length > 0 && (
            <Section title={t("updates")} className="mt-8">
              <ul className="flex flex-col gap-2">
                {results.updates.map((u) => (
                  <li key={u.id}>
                    <Link
                      href={`/s/${u.handle}`}
                      className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg bg-card p-4 shadow-soft transition-colors hover:bg-cream-warm"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-base font-bold text-ink">
                          {u.title}
                        </div>
                        <div className="truncate text-xs text-muted">
                          {u.creatorName} · {formatKstDate(u.publishedAt)}
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </div>
      </ConsumerShell>
    </>
  );
}
