"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { CreatorCover } from "@/components/CreatorCover";
import { FollowButton } from "@/components/FollowButton";
import { IconChevronLeft, IconChevronRight } from "@/components/ui/Icons";
import { ALL_CATEGORIES } from "@/lib/creatorTaxonomy";
import { usePersistedCollapse } from "@/lib/usePersistedCollapse";

const STORAGE_KEY = "motoo:rightRailCollapsed";

/**
 * The RightRail's client half — collapse state needs `localStorage`, which
 * the server component fetching `items` can't touch.
 *
 * Fold control sits inside the header row itself, before the title — hidden
 * (width 0) until the rail is hovered, then grows in and pushes the title
 * right to make room (DECISIONS 2026-07-31). Collapsed state shrinks the
 * whole rail to a thin strip holding just the reopen button, on the same
 * right edge the rail itself sits on.
 */
export function RightRailPanel({
  items,
}: {
  items: { id: string; handle: string; displayName: string; category: string }[];
}) {
  const t = useTranslations("home");
  const tc = useTranslations("common");
  const tax = useTranslations("creatorTaxonomy");
  const [collapsed, toggle] = usePersistedCollapse(STORAGE_KEY);

  if (collapsed) {
    return (
      <aside className="sticky top-16 hidden h-[calc(100vh-64px)] w-12 flex-none border-l border-line py-6 xl:block">
        <button
          type="button"
          onClick={() => toggle(false)}
          aria-label={tc("expand")}
          className="mx-auto flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-cream-warm hover:text-ink"
        >
          <IconChevronLeft width={18} height={18} />
        </button>
      </aside>
    );
  }

  return (
    <aside className="group sticky top-16 hidden max-h-[calc(100vh-64px)] w-[300px] flex-none overflow-y-auto border-l border-line px-4 py-6 xl:block">
      <div className="mb-4 flex items-center gap-1">
        <button
          type="button"
          onClick={() => toggle(true)}
          aria-label={tc("collapse")}
          className="flex h-7 w-0 flex-none items-center justify-center overflow-hidden rounded-full text-muted opacity-0 transition-all duration-150 group-hover:mr-1 group-hover:w-7 group-hover:opacity-100 hover:bg-cream-warm hover:text-ink"
        >
          <IconChevronRight width={16} height={16} />
        </button>
        <h2 className="min-w-0 flex-1 truncate text-[15px] font-extrabold tracking-[-0.01em] text-ink">
          {t("discoverTitle")}
        </h2>
        <Link
          href="/explore"
          className="flex-none text-[12.5px] font-bold text-coral-deep hover:underline"
        >
          {t("seeAll")} →
        </Link>
      </div>
      {items.length === 0 ? (
        <p className="text-[13px] leading-relaxed text-muted">
          {t("discoverEmpty")}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-x-3 gap-y-5">
          {items.map((s) => (
            <div key={s.handle}>
              <Link href={`/s/${s.handle}`} className="group/card block">
                <CreatorCover
                  handle={s.handle}
                  displayName={s.displayName}
                  className="h-[90px] w-full rounded-[10px] transition-opacity group-hover/card:opacity-90"
                  markClass="text-[22px]"
                />
                <div className="mt-2">
                  <div className="truncate text-[13px] font-extrabold text-ink">
                    {s.displayName}
                  </div>
                  <div className="mt-0.5 truncate text-[11px] text-muted">
                    {ALL_CATEGORIES.includes(s.category)
                      ? tax(`categories.${s.category}`)
                      : s.category}
                  </div>
                </div>
              </Link>
              <div className="mt-2">
                <FollowButton
                  streamerId={s.id}
                  handle={s.handle}
                  initialFollowing={false}
                  signedIn
                  compact
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}
