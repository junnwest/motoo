import Link from "next/link";
import { getTranslations } from "next-intl/server";

/**
 * Prev / page / next, as plain links (docs/PRELAUNCH.md #24).
 *
 * Links rather than a client-side "load more" button: each page is its own URL,
 * so it survives a refresh, the back button and being shared. An appended
 * in-memory list does none of those, and on a list someone might want to
 * reference — an order, a notification about a price change — that matters more
 * than the smoother scroll.
 *
 * The page number is one-based in the URL and zero-based everywhere else:
 * `?page=0` reads like a bug to anyone who sees it.
 */
export async function Pager({
  basePath,
  searchParams,
  page,
  hasMore,
  param = "page",
  anchor,
}: {
  basePath: string;
  searchParams: Record<string, string | string[] | undefined>;
  /** Zero-based. */
  page: number;
  hasMore: boolean;
  /** Query key to page on. Named so one page can carry two independent lists. */
  param?: string;
  /** Fragment to land on, for a list partway down a page. */
  anchor?: string;
}) {
  const t = await getTranslations("pager");
  if (!hasMore && page === 0) return null;

  const href = (onePage: number) => {
    // Rebuilt from the current query so paging keeps whatever filters are
    // active instead of silently resetting them.
    const next = new URLSearchParams();
    for (const [k, v] of Object.entries(searchParams)) {
      if (k === param) continue;
      if (typeof v === "string" && v) next.set(k, v);
    }
    if (onePage > 1) next.set(param, String(onePage));
    const qs = next.toString();
    const hash = anchor ? `#${anchor}` : "";
    return (qs ? `${basePath}?${qs}` : basePath) + hash;
  };

  const linkClass =
    "rounded-md border border-line-2 px-4 py-2 text-sm font-bold text-ink transition-colors hover:bg-cream-warm";

  return (
    <nav
      className="mt-6 flex items-center justify-center gap-3"
      aria-label={t("label")}
    >
      {page > 0 ? (
        <Link href={href(page)} className={linkClass} rel="prev">
          {t("prev")}
        </Link>
      ) : null}
      <span className="text-sm text-muted">{t("current", { page: page + 1 })}</span>
      {hasMore ? (
        <Link href={href(page + 2)} className={linkClass} rel="next">
          {t("next")}
        </Link>
      ) : null}
    </nav>
  );
}
